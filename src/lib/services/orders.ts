// src/lib/services/orders.ts
//
// Order creation service. The most important rule in this file:
//   THE SERVER FETCHES THE PRICE. The client never sends it.
//
// Caller (the POST /api/orders route handler) provides:
//   - userId (from the session — already authenticated)
//   - items: [{ productId, size, quantity }]
//
// We then:
//   1. De-duplicate identical (productId, size) lines
//   2. Re-fetch every product from the DB
//   3. Validate size is one of product.sizes
//   4. Calculate line price via the pricing service (never client-trusted)
//   5. Build snapshots: name, image, priceAtPurchase
//   6. Insert Order + OrderItems in one transaction
//
// Returns a Result. Caller decides HTTP status from the error string.

import { prisma } from "@/lib/prisma";
import { calculateLinePrice } from "@/lib/services/pricing";
import type { OrderStatus } from "@/generated/prisma/enums";

export type OrderItemInput = {
  productId: string;
  size: string;
  quantity: number;
};

export type CreateOrderResult =
  | { ok: true; data: { orderId: string; totalRupiah: number } }
  | { ok: false; error: string };

/**
 * Consolidate duplicate (productId, size) lines into one with summed quantity.
 * Basket should already do this, but the server is defensive.
 */
function deduplicate(items: OrderItemInput[]): OrderItemInput[] {
  const map = new Map<string, OrderItemInput>();
  for (const item of items) {
    const key = `${item.productId}::${item.size}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(key, { ...item });
    }
  }
  return Array.from(map.values());
}

export async function createOrder(
  userId: string,
  rawItems: OrderItemInput[]
): Promise<CreateOrderResult> {
  // 1. Reject empty carts. This shouldn't reach the service, but defensive.
  if (rawItems.length === 0) {
    return { ok: false, error: "Keranjang kosong" };
  }

  // 2. Validate every quantity is a positive integer.
  for (const item of rawItems) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return {
        ok: false,
        error: `Jumlah tidak valid untuk produk ${item.productId}`,
      };
    }
  }

  // 3. De-duplicate (same product, same size = one line)
  const items = deduplicate(rawItems);

  // 4. Re-fetch all products from DB in ONE query (not N queries — performance).
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  // 5. Build a lookup for fast access.
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 6. Validate every requested product exists.
  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return {
        ok: false,
        error: `Produk tidak ditemukan: ${item.productId}`,
      };
    }
  }

  // 7. Build the order-item rows (with snapshots) and compute total.
  type PreparedItem = {
    productId: string;
    nameSnapshot: string;
    imageSnapshot: string | null;
    size: string;
    quantity: number;
    priceAtPurchase: number;
  };

  const prepared: PreparedItem[] = [];
  let totalRupiah = 0;

  for (const item of items) {
    const product = productMap.get(item.productId)!; // safe — checked above

    // Validate size — product.sizes is Json (string[] at runtime)
    const sizes = product.sizes as string[];
    if (!sizes.includes(item.size)) {
      return {
        ok: false,
        error: `Ukuran "${item.size}" tidak tersedia untuk ${product.name}`,
      };
    }

    // SERVER-AUTHORITATIVE pricing. Never trust client price.
    const { unitPrice, lineTotal } = calculateLinePrice(product, item.quantity);

    // Image — first image if any. Safe-cast: images is Json (string[]).
    const images = product.images as string[];
    const firstImage = images.length > 0 ? images[0] : null;

    prepared.push({
      productId: product.id,
      nameSnapshot: product.name,
      imageSnapshot: firstImage,
      size: item.size,
      quantity: item.quantity,
      priceAtPurchase: unitPrice,
    });

    totalRupiah += lineTotal;
  }

  // 8. Persist everything in ONE transaction.
  //    If any insert fails, ALL rollback — no orphan order header,
  //    no partial items.
  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        status: "pending" satisfies OrderStatus,
        totalRupiah,
      },
    });

    // createMany is faster than N creates. Returns just a count, not the rows.
    await tx.orderItem.createMany({
      data: prepared.map((p) => ({ ...p, orderId: order.id })),
    });

    return order;
  });

  return {
    ok: true,
    data: { orderId: order.id, totalRupiah: order.totalRupiah },
  };
}
