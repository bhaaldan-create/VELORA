import "server-only";

import { prisma } from "@/lib/db";
import {
  awardForDeliveredOrder,
  isLoyaltyEligibleDeliveredOrder,
} from "@/lib/loyalty/award";
import { listStoredOrders } from "@/lib/orders";

export type BackfillResult = {
  scanned: number;
  eligible: number;
  awarded: number;
  skipped: number;
  errors: number;
};

/**
 * Idempotent purchase backfill for delivered eligible orders.
 * Does not award favorites/shares — purchase path only (via awardForDeliveredOrder).
 * Safe to re-run: unique ledger constraints prevent duplicates.
 */
export async function backfillPurchaseLoyalty(opts?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<BackfillResult> {
  const dryRun = opts?.dryRun === true;
  const all = await listStoredOrders();
  const delivered = all.filter((o) => o.status === "delivered");
  const limited =
    typeof opts?.limit === "number" ? delivered.slice(0, opts.limit) : delivered;

  const result: BackfillResult = {
    scanned: limited.length,
    eligible: 0,
    awarded: 0,
    skipped: 0,
    errors: 0,
  };

  for (const entry of limited) {
    if (!isLoyaltyEligibleDeliveredOrder(entry)) {
      result.skipped += 1;
      continue;
    }
    result.eligible += 1;
    if (dryRun) continue;

    try {
      const res = await awardForDeliveredOrder(entry);
      if (res.ok) {
        const anyAward = res.results?.some(
          (r) => r.ok && r.awarded > 0 && !r.duplicate,
        );
        if (anyAward) result.awarded += 1;
        else result.skipped += 1;
      } else {
        result.skipped += 1;
      }
    } catch (err) {
      console.error("[loyalty/backfill]", entry.orderId, err);
      result.errors += 1;
    }
  }

  return result;
}

/** Ensure every customer has a referral code (lazy-safe batch). */
export async function backfillReferralCodes(limit = 500) {
  const { ensureCustomerReferralCode } = await import(
    "@/lib/loyalty/referral-code"
  );
  const rows = await prisma.customer.findMany({
    where: { referralCode: null },
    select: { id: true },
    take: limit,
  });
  let n = 0;
  for (const row of rows) {
    await ensureCustomerReferralCode(row.id);
    n += 1;
  }
  return n;
}
