import type { ClubConfig } from "@/lib/club/types";
import { resolveOrderTotal } from "@/lib/shipping";
import type { OrderPayload } from "@/lib/order-email";

export function computeOrderPoints(
  order: OrderPayload,
  config: ClubConfig,
): number {
  const total = resolveOrderTotal(order);
  if (total <= 0) return 0;

  let earnMultiplier = 1;
  if (config.triplePointsActive) earnMultiplier = 3;
  else if (config.doublePointsActive) earnMultiplier = 2;

  return Math.floor(
    (total / Math.max(1, config.iqdPerPoint)) * earnMultiplier,
  );
}
