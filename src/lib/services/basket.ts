// src/lib/services/basket.ts
//
// Basket service. Every user has exactly one basket, created eagerly at
// registration (see api/auth/register/route.ts) — this file never creates
// one, only reads and mutates the basket that should already exist.
//
// Security rule that repeats through this file, same spirit as orders.ts:
// a BasketItem's id alone is never enough to act on it. Every mutation is
// scoped by the caller's own userId, reaching through the item's basket
// relation, so nobody can touch a basket that isn't theirs by guessing
// or reusing an id.

import { prisma } from "@/lib/prisma";

export type BasketMutationResult = { ok: true } | { ok: false; error: string };

/**
 * Fetch a user's basket, with each item's product included.
 * Shared by GET /api/basket and createOrder — one query, one place.
 */
export async function getBasket(userId: string) {
  return prisma.basket.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
}

/**
 * Add an item to the basket. Same product + size merges into the existing
 * line's quantity — the same rule as the ADD case in your original
 * client-side reducer. Different size is always a separate line.
 */
export async function addItem(
  userId: string,
  productId: string,
  size: string,
  quantity: number
): Promise<BasketMutationResult> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, error: "Jumlah tidak valid" };
  }

  const basket = await prisma.basket.findUnique({ where: { userId } });
  if (!basket) {
    return { ok: false, error: "Keranjang tidak ditemukan" };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return { ok: false, error: "Produk tidak ditemukan" };
  }

  const sizes = product.sizes as string[];
  if (!sizes.includes(size)) {
    return {
      ok: false,
      error: `Ukuran "${size}" tidak tersedia untuk ${product.name}`,
    };
  }

  const existing = await prisma.basketItem.findFirst({
    where: { basketId: basket.id, productId, size },
  });

  if (existing) {
    await prisma.basketItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.basketItem.create({
      data: { basketId: basket.id, productId, size, quantity },
    });
  }

  return { ok: true };
}

/**
 * Update a line's quantity. quantity <= 0 removes the line entirely —
 * same behavior as UPDATE_QTY in your original client-side reducer.
 *
 * Ownership is enforced IN the query, not as a separate check beforehand:
 * the where clause reaches through the item's basket relation to filter
 * on basket.userId, so a basketItemId belonging to someone else's basket
 * simply matches nothing. count comes back 0 either way — whether the id
 * never existed or belonged to another user — so the response can't be
 * used to probe which one it was.
 */
export async function updateQuantity(
  userId: string,
  basketItemId: string,
  quantity: number
): Promise<BasketMutationResult> {
  if (!Number.isInteger(quantity)) {
    return { ok: false, error: "Jumlah tidak valid" };
  }

  if (quantity <= 0) {
    const { count } = await prisma.basketItem.deleteMany({
      where: { id: basketItemId, basket: { userId } },
    });
    return count === 0
      ? { ok: false, error: "Item tidak ditemukan" }
      : { ok: true };
  }

  const { count } = await prisma.basketItem.updateMany({
    where: { id: basketItemId, basket: { userId } },
    data: { quantity },
  });

  return count === 0
    ? { ok: false, error: "Item tidak ditemukan" }
    : { ok: true };
}

/**
 * Remove a line entirely. Same ownership-through-relation pattern as
 * updateQuantity.
 */
export async function removeItem(
  userId: string,
  basketItemId: string
): Promise<BasketMutationResult> {
  const { count } = await prisma.basketItem.deleteMany({
    where: { id: basketItemId, basket: { userId } },
  });

  return count === 0
    ? { ok: false, error: "Item tidak ditemukan" }
    : { ok: true };
}
