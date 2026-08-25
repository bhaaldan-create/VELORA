/**
 * Lightweight self-check for finance product-cost helpers.
 * Run: npx tsx scripts/check-finance-cost.ts
 */
import {
  analyzeProductCost,
  computeLandedCostIqd,
  salePriceIqd,
  toIqd,
} from "../src/lib/finance/product-cost";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const base = {
  costCurrency: "USD",
  costExchangeRate: 1500,
  purchasePrice: 10,
  shippingCostIqd: 1000,
  customsCostIqd: 500,
  brokerageCostIqd: 0,
  handlingCostIqd: 0,
  otherCostIqd: 0,
  price: 30000,
  discountPercent: 0,
  minMarginPct: 20,
};

assert(salePriceIqd(10000, 10) === 9000, "salePrice discount");
assert(computeLandedCostIqd(base) === 16500, "landed USD");
assert(toIqd(10, "USD", 1500) === 15000, "toIqd");

const ok = analyzeProductCost(base);
assert(ok.hasCostData === true, "has cost");
assert(ok.landedCostIqd === 16500, "analysis landed");
assert(ok.grossProfit === 13500, "gross profit");
assert(ok.grossMarginPct !== null && ok.grossMarginPct > 40, "margin");

const missing = analyzeProductCost({
  ...base,
  purchasePrice: 0,
  shippingCostIqd: 0,
  customsCostIqd: 0,
});
assert(missing.hasCostData === false, "insufficient");
assert(missing.grossProfit === null, "no invented COGS");

console.log("finance product-cost checks OK");
