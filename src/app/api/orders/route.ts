// src/app/api/orders/route.ts
//
// POST /api/orders
//
// Creates a new pending order for the authenticated user. Body:
//   { items: [{ productId, size, quantity }] }
//
// NO PRICE in the request. The server computes it. This is the single
// most important security property of an e-commerce checkout endpoint —
// trusting client prices is how Rp 1 orders end up in production.
//
// Route handler is THIN. All business rules live in lib/services/orders.ts.

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createOrder } from "@/lib/services/orders";

const ItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().positive(),
});

const CreateOrderSchema = z.object({
  items: z.array(ItemSchema).min(1, "Keranjang kosong"),
});

export async function POST(request: NextRequest) {
  // 1. AUTH GUARD. No anonymous orders. This pattern will repeat on every
  //    protected route handler we ever write — consider extracting to a
  //    helper if it grows past 3-4 routes.
  const session = await getSession();
  if (!session) {
    return Response.json(
      { error: "Anda harus masuk untuk checkout" },
      { status: 401 }
    );
  }

  // 2. Parse and validate input shape (zod). Anything deeper is the
  //    service's job — we don't care about prices, stock, or sizes here.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 3. Hand off to the service. The service owns:
  //    - product re-fetching
  //    - size validation
  //    - price calculation
  //    - snapshot building
  //    - the database transaction
  const result = await createOrder(session.user.id, parsed.data.items);

  if (!result.ok) {
    // Service errors are all "user-caused" for now (bad product, bad size,
    // empty cart). Collapse to 400. If you later add "internal" errors
    // (DB unreachable, etc.), differentiate via an error code field.
    return Response.json({ error: result.error }, { status: 400 });
  }

  // 4. Success — return 201 with the new order ID and total.
  //    Hand-pick: only what the client needs to navigate to the
  //    confirmation page. Don't ship the whole order row.
  return Response.json(
    {
      order: {
        id: result.data.orderId,
        totalRupiah: result.data.totalRupiah,
      },
    },
    { status: 201 }
  );
}
