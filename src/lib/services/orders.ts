// src/lib/services/orders.ts
//
// Order creation service. The most important rule in this file:
//   THE SERVER FETCHES THE PRICE. The client never sends it.
//
// Checkout no longer accepts items from the caller. The order is built
// entirely from the authenticated user's own Basket — the server is the
// only source of truth for what's being purchased.
//
// Given just userId (from the session — already authenticated), we:
//   1. Fetch the user's Basket, with each item's Product included
//   2. Reject if the basket is missing or empty
//   3. Reject if any item's product is unavailable (deleted -> null)
//   4. Validate quantities defensively
//   5. De-duplicate identical (productId, size) lines defensively
//   6. Validate size is one of product.sizes
//   7. Calculate line price via the pricing service (never client-trusted)
//   8. Build snapshots: name, image, priceAtPurchase
//   9. Insert Order + OrderItems, and clear the Basket's items,
//      all in one transaction
//
// Returns a Result. Caller decides HTTP status from the error string.

import { prisma } from "@/lib/prisma";
import { calculateLinePrice } from "@/lib/services/pricing";
import type { OrderStatus } from "@/generated/prisma/enums";

export type CreateOrderResult =
  | { ok: true; data: { orderId: string; totalRupiah: number } }
  | { ok: false; error: string };

type BasketLine = {
  productId: string;
  size: string;
  quantity: number;
};

/**
 * Consolidate duplicate (productId, size) lines into one with summed quantity.
 * Basket-add should already prevent this, but the server is defensive.
 */
function deduplicate(items: BasketLine[]): BasketLine[] {
  const map = new Map<string, BasketLine>();
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

export async function createOrder(userId: string): Promise<CreateOrderResult> {
  // 1. Fetch the user's basket, with each item's product included.
  const basket = await prisma.basket.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  // 2. Reject if there's no basket yet, or it's empty.
  if (!basket || basket.items.length === 0) {
    return { ok: false, error: "Keranjang kosong" };
  }

  // 3. Reject if any item points at a product that's been removed.
  //    A deleted product SetNulls productId on the BasketItem — that's
  //    what "unavailable" means at the schema level.
  const hasUnavailable = basket.items.some((item) => item.product === null);
  if (hasUnavailable) {
    return {
      ok: false,
      error: "Hapus item yang tidak tersedia sebelum checkout",
    };
  }

  // 4. Validate quantities defensively (basket-add should already enforce this).
  for (const item of basket.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return {
        ok: false,
        error: `Jumlah tidak valid untuk produk ${item.productId}`,
      };
    }
  }

  // 5. De-duplicate (same product, same size = one line), defensively.
  //    Safe to cast productId to string — step 3 already rejected any null ones.
  const items = deduplicate(
    basket.items.map((item) => ({
      productId: item.productId as string,
      size: item.size,
      quantity: item.quantity,
    }))
  );

  // 6. Build a lookup from the already-fetched products — no second query needed,
  //    unlike the old version, because `include` brought them along for free.
  const productMap = new Map(
    basket.items.map((item) => [item.productId as string, item.product!])
  );

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

    const sizes = product.sizes as string[];
    if (!sizes.includes(item.size)) {
      return {
        ok: false,
        error: `Ukuran "${item.size}" tidak tersedia untuk ${product.name}`,
      };
    }

    const { unitPrice, lineTotal } = calculateLinePrice(product, item.quantity);

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

  // 8. Persist everything in ONE transaction: create the order, insert its
  //    items, AND clear the basket — all or nothing.
  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        status: "pending" satisfies OrderStatus,
        totalRupiah,
      },
    });

    await tx.orderItem.createMany({
      data: prepared.map((p) => ({ ...p, orderId: order.id })),
    });

    await tx.basketItem.deleteMany({
      where: { basketId: basket.id },
    });

    return order;
  });

  return {
    ok: true,
    data: { orderId: order.id, totalRupiah: order.totalRupiah },
  };
}
