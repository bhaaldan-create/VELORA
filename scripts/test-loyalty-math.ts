/**
 * Unit tests for loyalty purchase math & proportional reversal.
 * Run: npx tsx scripts/test-loyalty-math.ts
 */
import {
  purchasePointsFromAmount,
  proportionalPointsToReverse,
  eligiblePurchaseAmountIQD,
} from "../src/lib/loyalty/purchase-math";
import { LOYALTY_CONFIG } from "../src/lib/loyalty/config";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function eq(actual: number, expected: number, label: string) {
  assert(
    actual === expected,
    `${label}: expected ${expected}, got ${actual}`,
  );
}

const iqd = LOYALTY_CONFIG.purchase.iqdPerPoint;

eq(purchasePointsFromAmount(4999, iqd), 0, "4999 → 0");
eq(purchasePointsFromAmount(5000, iqd), 1, "5000 → 1");
eq(purchasePointsFromAmount(49999, iqd), 9, "49999 → 9");
eq(purchasePointsFromAmount(50000, iqd), 10, "50000 → 10");
eq(purchasePointsFromAmount(100000, iqd), 20, "100000 → 20");
eq(purchasePointsFromAmount(250000, iqd), 50, "250000 → 50");
eq(purchasePointsFromAmount(500000, iqd), 100, "500000 → 100");
eq(purchasePointsFromAmount(1000000, iqd), 200, "1000000 → 200");

eq(
  eligiblePurchaseAmountIQD({
    subtotal: 50000,
    deliveryFee: 5000,
    total: 55000,
    items: [],
    fullName: "",
    email: "",
    phone: "",
  } as never),
  50000,
  "eligible excludes shipping via subtotal",
);

eq(
  proportionalPointsToReverse({
    originalEligibleIQD: 100000,
    refundedEligibleIQD: 50000,
    originalPoints: 20,
  }),
  10,
  "partial refund half points",
);

eq(
  proportionalPointsToReverse({
    originalEligibleIQD: 100000,
    refundedEligibleIQD: 100000,
    originalPoints: 20,
  }),
  20,
  "full refund all points",
);

console.log("loyalty math tests: OK");
