// src/lib/services/pricing.ts
//
// Pricing service — the SERVER-SIDE source of truth for what a line costs.
// Reused by order creation, future invoice generation, and (eventually)
// payment intent calculation.
//
// Pure function. No DB, no IO. Tests should be trivial:
//   given a product + quantity + clock, assert the returned lineTotal.

import type { Product as PrismaProduct } from "@/generated/prisma/client";
import { resolveDisplayPrice } from "@/data/promotion";

export type LinePriceResult = {
  unitPrice: number; // price per unit after promotion (rupiah, Int)
  lineTotal: number; // unitPrice * quantity (rupiah, Int)
  isOnSale: boolean; // did a promotion apply?
  originalUnitPrice?: number; // pre-discount price, set only if on sale
};

/**
 * Calculate the price for a single order-line.
 *
 * NOT used for UI display — that's still `resolveDisplayPrice` directly.
 * THIS is used for ORDER CREATION, where the price must come from the
 * server (never the client) and gets snapshot into OrderItem.priceAtPurchase.
 *
 * Throws if quantity is invalid — caller (orders service) catches and
 * converts to a Result. We throw here rather than return Result because
 * an invalid quantity is a programmer error, not a normal flow.
 */
export function calculateLinePrice(
  product: PrismaProduct,
  quantity: number
): LinePriceResult {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(
      `calculateLinePrice: quantity must be a positive integer, got ${quantity}`
    );
  }

  // resolveDisplayPrice already handles "is there an active promo for
  // this productId" and "what discount applies." We just wrap it.
  const resolved = resolveDisplayPrice(product.price, product.id);

  return {
    unitPrice: resolved.displayPrice,
    lineTotal: resolved.displayPrice * quantity,
    isOnSale: resolved.isOnSale,
    originalUnitPrice: resolved.originalPrice,
  };
}
