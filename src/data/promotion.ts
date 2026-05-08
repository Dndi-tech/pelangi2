// src/data/promotions.ts

export type Promotion = {
  id: string;
  productIds: string[]; // which products this promotion applies to
  badge: "Diskon" | "Baru" | "Terlaris" | "Spesial"; // badge label
  discountPercent?: number; // optional — only if it's a price discount
  startDate: string;
  endDate: string;
};

export const promotions: Promotion[] = [
  {
    id: "promo_001",
    productIds: ["1", "3", "9"], // Seragam SD, Seragam SMP, etc
    badge: "Diskon",
    discountPercent: 20,
    startDate: "2026-05-01",
    endDate: "2026-05-31",
  },
  {
    id: "promo_002",
    productIds: ["2", "6"], // new arrivals
    badge: "Baru",
    startDate: "2026-05-01",
    endDate: "2026-06-30",
  },
  {
    id: "promo_003",
    productIds: ["5", "8"], // best sellers
    badge: "Terlaris",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
  {
    id: "promo_004",
    productIds: ["4", "7"], // special event
    badge: "Spesial",
    discountPercent: 15,
    startDate: "2026-05-10",
    endDate: "2026-05-20",
  },
];
// src/data/promotions.ts — add this below the data

function isActive(promo: Promotion): boolean {
  const now = Date.now();
  return (
    now >= new Date(promo.startDate).getTime() &&
    now <= new Date(promo.endDate).getTime()
  );
}

// Call this in ProductCard to get the badge for a product
export function getProductPromotion(productId: string): Promotion | null {
  return (
    promotions.find((p) => isActive(p) && p.productIds.includes(productId)) ??
    null
  );
}
// ── PRICE CALCULATION ──────────────────────────────────────────
// Handles display price for frontend only
// Bulk / voucher calculations → handled later in pricing.ts
export type ResolvedPrice = {
  displayPrice: number;
  originalPrice?: number; // only set when discount applies
  isOnSale: boolean;
  discountPercent?: number;
};

export function resolveDisplayPrice(
  originalPrice: number,
  productId: string
): ResolvedPrice {
  const promo = getProductPromotion(productId);

  // Has active promotion with discount
  if (promo?.discountPercent) {
    return {
      displayPrice: Math.round(
        originalPrice * (1 - promo.discountPercent / 100)
      ),
      originalPrice, // show crossed out
      isOnSale: true,
      discountPercent: promo.discountPercent,
    };
  }

  // No discount — show as is, no strikethrough
  return {
    displayPrice: originalPrice,
    isOnSale: false,
  };
}
