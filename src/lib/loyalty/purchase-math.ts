import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import type { OrderPayload } from "@/lib/order-email";

/** Eligible purchase amount excludes shipping / delivery fees. */
export function eligiblePurchaseAmountIQD(order: OrderPayload): number {
  const sub = Number(order.subtotal);
  if (!Number.isFinite(sub) || sub <= 0) return 0;
  return Math.floor(sub);
}

export function purchasePointsFromAmount(
  eligibleAmountIQD: number,
  iqdPerPoint: number = LOYALTY_CONFIG.purchase.iqdPerPoint,
  multiplier: number = 1,
): number {
  if (eligibleAmountIQD <= 0 || iqdPerPoint <= 0) return 0;
  const mult = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
  return Math.floor(eligibleAmountIQD / iqdPerPoint) * Math.floor(mult);
}

export function purchasePointsForOrder(
  order: OrderPayload,
  opts?: { iqdPerPoint?: number; multiplier?: number },
): number {
  return purchasePointsFromAmount(
    eligiblePurchaseAmountIQD(order),
    opts?.iqdPerPoint ?? LOYALTY_CONFIG.purchase.iqdPerPoint,
    opts?.multiplier ?? 1,
  );
}

/** Proportional clawback for partial refunds (future-ready). */
export function proportionalPointsToReverse(input: {
  originalEligibleIQD: number;
  refundedEligibleIQD: number;
  originalPoints: number;
}): number {
  const { originalEligibleIQD, refundedEligibleIQD, originalPoints } = input;
  if (originalEligibleIQD <= 0 || originalPoints <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, refundedEligibleIQD / originalEligibleIQD));
  return Math.min(originalPoints, Math.floor(originalPoints * ratio));
}
