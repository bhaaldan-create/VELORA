import type { ClubConfig } from "@/lib/club/types";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import { purchasePointsForOrder } from "@/lib/loyalty/purchase-math";
import type { OrderPayload } from "@/lib/order-email";

/**
 * Points shown on MY VELORA cards — aligned with loyalty purchase rules
 * (subtotal only, 5,000 IQD = 1 point, optional club multipliers).
 */
export function computeOrderPoints(
  order: OrderPayload,
  config: ClubConfig,
): number {
  let earnMultiplier = 1;
  if (config.triplePointsActive) earnMultiplier = 3;
  else if (config.doublePointsActive) earnMultiplier = 2;

  return purchasePointsForOrder(order, {
    iqdPerPoint: Math.max(
      1,
      config.iqdPerPoint || LOYALTY_CONFIG.purchase.iqdPerPoint,
    ),
    multiplier: earnMultiplier,
  });
}
