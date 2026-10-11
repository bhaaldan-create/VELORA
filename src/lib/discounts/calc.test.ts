import assert from "node:assert/strict";
import {
  commissionAmount,
  displayStatus,
  normalizeCouponCode,
  quoteDiscount,
  type CouponRule,
  type DiscountLine,
} from "./calc.ts";

const rule = (patch: Partial<CouponRule> = {}): CouponRule => ({
  type: "PERCENT",
  value: 10,
  maxDiscountIqd: null,
  minSubtotalIqd: 0,
  applyToSaleItems: true,
  eligibleProductIds: [],
  eligibleCategories: [],
  eligibleBrands: [],
  excludedProductIds: [],
  excludedCategories: [],
  excludedBrands: [],
  minMarginPercent: null,
  ...patch,
});

const line = (patch: Partial<DiscountLine> = {}): DiscountLine => ({
  id: "p1",
  unitPrice: 10000,
  quantity: 1,
  basePrice: 10000,
  discountPercent: 0,
  categorySlug: "skincare",
  brandName: "VELORA",
  ...patch,
});

const percent = quoteDiscount({
  lines: [line({ unitPrice: 333, quantity: 1, basePrice: 333 })],
  deliveryFee: 5000,
  rule: rule({ value: 10 }),
});
assert.equal(percent.ok, true);
if (percent.ok) assert.equal(percent.merchandiseDiscount, 33);

const fixed = quoteDiscount({
  lines: [line({ unitPrice: 20000 })],
  deliveryFee: 5000,
  rule: rule({ type: "FIXED", value: 25000 }),
});
assert.equal(fixed.ok, true);
if (fixed.ok) {
  assert.equal(fixed.merchandiseDiscount, 20000);
  assert.equal(fixed.merchandiseAfter, 0);
  assert.equal(fixed.payable, 5000);
}

const cap = quoteDiscount({
  lines: [line({ unitPrice: 100000 })],
  deliveryFee: 5000,
  rule: rule({ value: 50, maxDiscountIqd: 10000 }),
});
assert.equal(cap.ok, true);
if (cap.ok) assert.equal(cap.merchandiseDiscount, 10000);

const min = quoteDiscount({
  lines: [line({ unitPrice: 1000 })],
  deliveryFee: 5000,
  rule: rule({ minSubtotalIqd: 30000 }),
});
assert.equal(min.ok, false);

const category = quoteDiscount({
  lines: [line({ categorySlug: "makeup" })],
  deliveryFee: 5000,
  rule: rule({ eligibleCategories: ["skincare"] }),
});
assert.equal(category.ok, false);

const excluded = quoteDiscount({
  lines: [line()],
  deliveryFee: 5000,
  rule: rule({ excludedProductIds: ["p1"] }),
});
assert.equal(excluded.ok, false);

const saleSkipped = quoteDiscount({
  lines: [
    line({ id: "sale", discountPercent: 20, unitPrice: 8000, basePrice: 10000 }),
    line({ id: "full", unitPrice: 5000, basePrice: 5000 }),
  ],
  deliveryFee: 5000,
  rule: rule({ value: 10, applyToSaleItems: false }),
});
assert.equal(saleSkipped.ok, true);
if (saleSkipped.ok) assert.equal(saleSkipped.merchandiseDiscount, 500);

const shipping = quoteDiscount({
  lines: [line()],
  deliveryFee: 5000,
  rule: rule({ type: "FREE_SHIPPING", value: 0 }),
});
assert.equal(shipping.ok, true);
if (shipping.ok) {
  assert.equal(shipping.deliveryFee, 0);
  assert.equal(shipping.merchandiseDiscount, 0);
  assert.equal(shipping.payable, 10000);
}

assert.equal(normalizeCouponCode("  velora 10 "), "VELORA10");
assert.equal(commissionAmount(13500, "PERCENT", 5), 675);
assert.equal(commissionAmount(1000, "FIXED", 5000), 1000);

const now = new Date("2026-10-11T12:00:00+03:00");
assert.equal(
  displayStatus({
    status: "ACTIVE",
    startsAt: new Date("2026-10-12T00:00:00+03:00"),
    endsAt: null,
    now,
    used: 0,
    maxRedemptions: null,
  }),
  "SCHEDULED",
);
assert.equal(
  displayStatus({
    status: "ACTIVE",
    startsAt: null,
    endsAt: new Date("2026-10-01T00:00:00+03:00"),
    now,
    used: 0,
    maxRedemptions: null,
  }),
  "EXPIRED",
);
assert.equal(
  displayStatus({
    status: "ACTIVE",
    startsAt: null,
    endsAt: null,
    now,
    used: 3,
    maxRedemptions: 3,
  }),
  "EXHAUSTED",
);

console.log("discount engine tests passed");
