Pelangi 2 — Pricing Architecture
Overview
Pelangi 2 uses a layered pricing model. Each layer can override the one below it.
The frontend always displays the final resolved price, never raw business data.

Price Layers (lowest to highest precedence)

1. buyingPrice × categoryMargin → base selling price
2. product.salePrice → manual override by shop owner
3. Promotion engine → event-based discounts
4. Bulk pricing → quantity-based discounts
   When calculating final price for a transaction:

Start at layer 1
Each higher layer overrides if its condition is met
If multiple promotions are active, the system applies the highest discount
unless the promotion type explicitly disallows stacking

Layer 1 — Base Price (buying price + margin)

Every product stores a buyingPrice (what the shop pays the supplier)
Each category has a fixed marginPercent defined in a category config table
Base selling price = buyingPrice × (1 + marginPercent)
This is what gets stored as product.price in the database

Category Margin Config (example, to be confirmed with shop owner)
CategoryMarginmen40%women40%kids35%school25%custom50%

Note: Margins should be reviewed with the actual shop owner before implementation.
Custom category margin may vary per order.

Layer 2 — Manual Sale Price

Shop owner can manually set salePrice on any product
When salePrice is present, it takes full precedence over base price
Used for clearance, end-of-season, or one-off pricing decisions
Frontend logic: const displayPrice = product.salePrice ?? product.price
salePrice is stored directly on the product record

Layer 3 — Promotion Engine

Promotions are stored in a separate promotions table
A promotion can target products by: productId, brand, category, or name (partial match)
Each promotion has: discountPercent, startDate, endDate, allowStacking flag
Promotions are checked at transaction time, not stored on the product
Active promotion = current date is between startDate and endDate

Badge Derivation (UI only)
Badge labels ("sale", "new", "popular") are computed, never stored on the product:
BadgeConditionsaleActive promotion targets this product OR salePrice setnewproduct.createdAt is within last 30 dayspopularSales count exceeds threshold (TBD) in last 30 days

Layer 4 — Bulk Pricing

Applied at transaction level, not product level
Triggered when quantity of a single product (or category) exceeds a fixed threshold
Each promotion type has an allowBulkStack flag

If false: bulk discount and promo discount do not stack, higher one wins
If true: both apply

Bulk pricing config lives in a bulk_pricing_rules table:

category — which category this rule applies to
minQuantity — minimum items to trigger
discountPercent — discount applied

Example
School uniform, buy 5 or more → 15% off
Men's clothing, buy 3 or more → 10% off

Transaction Price Resolution (pseudocode)
function resolvePrice(product, quantity, activePromotions, bulkRules):
basePrice = product.salePrice ?? product.price

// Find best applicable promotion
bestPromo = activePromotions
.filter(p => targets(p, product))
.sort(by discountPercent descending)
.first()

// Find applicable bulk rule
bulkRule = bulkRules
.filter(r => r.category === product.category && quantity >= r.minQuantity)
.sort(by discountPercent descending)
.first()

// Apply discounts
if bestPromo and bulkRule:
if bestPromo.allowBulkStack:
finalPrice = basePrice × (1 - bestPromo.discount) × (1 - bulkRule.discount)
else:
finalPrice = basePrice × (1 - max(bestPromo.discount, bulkRule.discount))
else if bestPromo:
finalPrice = basePrice × (1 - bestPromo.discount)
else if bulkRule:
finalPrice = basePrice × (1 - bulkRule.discount)
else:
finalPrice = basePrice

return finalPrice

What's Deferred to Phase 2-3

promotions database table
bulk_pricing_rules database table
Category margin config table
buyingPrice field on product (currently abstracted into price)
Admin UI for managing promotions
Transaction engine implementation

Phase 1 Simplification
During Phase 1 (frontend only), pricing is simplified:
typescriptconst displayPrice = product.salePrice ?? product.price;
No promotion engine, no bulk logic. Just display the right number.
This is intentional — the UI is built against the final data shape,
but business logic is deferred until the backend exists.
