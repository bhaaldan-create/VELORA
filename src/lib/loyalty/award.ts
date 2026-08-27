import "server-only";

import { prisma } from "@/lib/db";
import {
  LOYALTY_CONFIG,
  LOYALTY_DIRECTION,
  LOYALTY_EVENT,
  type LoyaltyDirection,
  type LoyaltyEventType,
} from "@/lib/loyalty/config";
import {
  loyaltyEventLabel,
  purchaseActivityLabel,
} from "@/lib/loyalty/labels";
import {
  purchasePointsForOrder,
  proportionalPointsToReverse,
} from "@/lib/loyalty/purchase-math";
import { ensureCustomerReferralCode } from "@/lib/loyalty/referral-code";
import type { OrderPayload } from "@/lib/order-email";
import type { StoredOrder } from "@/lib/order-types";
import {
  isMyVeloraEligibleOrder,
} from "@/lib/my-velora/eligibility";
import type { Prisma } from "@/generated/prisma/client";

export type AwardResult =
  | { ok: true; awarded: number; entryId: string; duplicate?: boolean }
  | { ok: false; reason: string; awarded: 0 };

type AwardInput = {
  customerId: string;
  eventType: LoyaltyEventType | string;
  points: number;
  referenceId: string;
  direction?: LoyaltyDirection;
  orderId?: string;
  productId?: string;
  qrCampaignId?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  meta?: Record<string, unknown>;
  /** When set, reject if this many EARN points for eventType already posted today */
  dailyPointLimit?: number;
  /** When set, reject if this many EARN points for eventType already posted this calendar month */
  monthlyPointLimit?: number;
};

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

async function sumEarnedPointsSince(
  customerId: string,
  eventType: string,
  since: Date,
): Promise<number> {
  const rows = await prisma.loyaltyLedgerEntry.aggregate({
    where: {
      customerId,
      eventType,
      direction: LOYALTY_DIRECTION.EARN,
      status: "posted",
      createdAt: { gte: since },
    },
    _sum: { points: true },
  });
  return rows._sum.points ?? 0;
}

export async function getLoyaltyBalance(customerId: string) {
  const row = await prisma.customerLoyaltyBalance.findUnique({
    where: { customerId },
  });
  return {
    available: row?.available ?? 0,
    lifetimeEarned: row?.lifetimeEarned ?? 0,
    lifetimeRedeemed: row?.lifetimeRedeemed ?? 0,
    pending: row?.pending ?? 0,
  };
}

export async function awardPoints(input: AwardInput): Promise<AwardResult> {
  const points = Math.trunc(input.points);
  if (!input.customerId || !input.referenceId || !input.eventType) {
    return { ok: false, reason: "invalid_input", awarded: 0 };
  }
  if (points === 0) {
    return { ok: false, reason: "zero_points", awarded: 0 };
  }

  const direction =
    input.direction ??
    (points > 0 ? LOYALTY_DIRECTION.EARN : LOYALTY_DIRECTION.ADJUSTMENT);
  const absPoints = Math.abs(points);

  if (direction === LOYALTY_DIRECTION.EARN && absPoints > 0) {
    if (input.dailyPointLimit != null) {
      const used = await sumEarnedPointsSince(
        input.customerId,
        input.eventType,
        startOfUtcDay(),
      );
      if (used + absPoints > input.dailyPointLimit) {
        return { ok: false, reason: "daily_limit", awarded: 0 };
      }
    }
    if (input.monthlyPointLimit != null) {
      const used = await sumEarnedPointsSince(
        input.customerId,
        input.eventType,
        startOfUtcMonth(),
      );
      if (used + absPoints > input.monthlyPointLimit) {
        return { ok: false, reason: "monthly_limit", awarded: 0 };
      }
    }
  }

  const descriptionAr =
    input.descriptionAr ?? loyaltyEventLabel(input.eventType, "ar");
  const descriptionEn =
    input.descriptionEn ?? loyaltyEventLabel(input.eventType, "en");

  /** Net change to available balance for this posting. */
  let deltaAvailable = 0;
  let earnedDelta = 0;
  let redeemedDelta = 0;
  if (direction === LOYALTY_DIRECTION.EARN) {
    deltaAvailable = absPoints;
    earnedDelta = absPoints;
  } else if (
    direction === LOYALTY_DIRECTION.REVERSAL ||
    direction === LOYALTY_DIRECTION.REDEEM
  ) {
    deltaAvailable = -absPoints;
    if (direction === LOYALTY_DIRECTION.REDEEM) redeemedDelta = absPoints;
  } else {
    // ADJUSTMENT: signed `points` from caller
    deltaAvailable = points;
    if (points > 0) earnedDelta = absPoints;
    else redeemedDelta = absPoints;
  }

  try {
    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.loyaltyLedgerEntry.create({
        data: {
          customerId: input.customerId,
          eventType: input.eventType,
          points: absPoints,
          direction,
          status: "posted",
          referenceId: input.referenceId,
          orderId: input.orderId,
          productId: input.productId,
          qrCampaignId: input.qrCampaignId,
          descriptionAr,
          descriptionEn,
          metaJson: (input.meta ?? {}) as Prisma.InputJsonValue,
        },
      });

      await tx.customerLoyaltyBalance.upsert({
        where: { customerId: input.customerId },
        create: {
          customerId: input.customerId,
          available: Math.max(0, deltaAvailable),
          lifetimeEarned: earnedDelta,
          lifetimeRedeemed: redeemedDelta,
          pending: 0,
        },
        update: {
          available: { increment: deltaAvailable },
          lifetimeEarned: earnedDelta ? { increment: earnedDelta } : undefined,
          lifetimeRedeemed: redeemedDelta
            ? { increment: redeemedDelta }
            : undefined,
        },
      });

      const bal = await tx.customerLoyaltyBalance.findUnique({
        where: { customerId: input.customerId },
      });
      if (bal && bal.available < 0) {
        await tx.customerLoyaltyBalance.update({
          where: { customerId: input.customerId },
          data: { available: 0 },
        });
      }

      return created;
    });

    return { ok: true, awarded: absPoints, entryId: entry.id };
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return { ok: true, awarded: 0, entryId: "", duplicate: true };
    }
    console.error("[loyalty/awardPoints]", err);
    return { ok: false, reason: "db_error", awarded: 0 };
  }
}

export async function awardAccountCreated(customerId: string) {
  return awardPoints({
    customerId,
    eventType: LOYALTY_EVENT.ACCOUNT_CREATED,
    points: LOYALTY_CONFIG.signup.points,
    referenceId: customerId,
  });
}

export function isProfileComplete(customer: {
  fullName: string;
  phone: string | null;
  email: string;
  address: string;
  dateOfBirth: Date | null;
  governorate: string | null;
}): boolean {
  return Boolean(
    customer.fullName?.trim() &&
      customer.phone?.trim() &&
      customer.email?.trim() &&
      customer.address?.trim() &&
      customer.dateOfBirth &&
      customer.governorate?.trim(),
  );
}

export async function maybeAwardProfileCompleted(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      fullName: true,
      phone: true,
      email: true,
      address: true,
      dateOfBirth: true,
      governorate: true,
    },
  });
  if (!customer || !isProfileComplete(customer)) {
    return { ok: false as const, reason: "incomplete", awarded: 0 as const };
  }
  return awardPoints({
    customerId,
    eventType: LOYALTY_EVENT.PROFILE_COMPLETED,
    points: LOYALTY_CONFIG.profileCompletion.points,
    referenceId: customerId,
  });
}

export async function awardFavoritePoints(
  customerId: string,
  productId: string,
) {
  return awardPoints({
    customerId,
    eventType: LOYALTY_EVENT.PRODUCT_FAVORITED,
    points: LOYALTY_CONFIG.favorite.points,
    referenceId: productId,
    productId,
    dailyPointLimit: LOYALTY_CONFIG.favorite.dailyLimit,
    monthlyPointLimit: LOYALTY_CONFIG.favorite.monthlyLimit,
  });
}

export async function awardReferralShare(customerId: string, dayKey: string) {
  return awardPoints({
    customerId,
    eventType: LOYALTY_EVENT.REFERRAL_LINK_SHARED,
    points: LOYALTY_CONFIG.shareReferral.points,
    referenceId: dayKey,
    dailyPointLimit: LOYALTY_CONFIG.shareReferral.dailyLimit,
    monthlyPointLimit: LOYALTY_CONFIG.shareReferral.monthlyLimit,
  });
}

async function activePurchaseMultiplier(at = new Date()): Promise<number> {
  try {
    const promo = await prisma.loyaltyPromoCampaign.findFirst({
      where: {
        active: true,
        type: "purchase_multiplier",
        startsAt: { lte: at },
        endsAt: { gte: at },
      },
      orderBy: { multiplier: "desc" },
    });
    if (promo && promo.multiplier > 1) return promo.multiplier;

    const { getClubConfig } = await import("@/lib/club/config");
    const club = await getClubConfig();
    if (club.triplePointsActive) return 3;
    if (club.doublePointsActive) return 2;
  } catch {
    // ignore — default 1x
  }
  return 1;
}

export function isLoyaltyEligibleDeliveredOrder(entry: StoredOrder): boolean {
  if (!isMyVeloraEligibleOrder(entry)) return false;
  const eligible = eligibleSubtotal(entry.order);
  return eligible > 0;
}

function eligibleSubtotal(order: OrderPayload) {
  const sub = Number(order.subtotal);
  return Number.isFinite(sub) && sub > 0 ? Math.floor(sub) : 0;
}

async function resolveOrderCustomerId(
  stored: StoredOrder,
): Promise<string | null> {
  if (stored.order.customerId) return stored.order.customerId;
  const email = (stored.order.email || "").trim().toLowerCase();
  if (!email) return null;
  const customer = await prisma.customer.findUnique({
    where: { email },
    select: { id: true },
  });
  return customer?.id ?? null;
}

/**
 * Grant purchase + first-purchase + referral success for a delivered order.
 * Idempotent via unique (customerId, eventType, referenceId).
 */
export async function awardForDeliveredOrder(stored: StoredOrder) {
  if (!isLoyaltyEligibleDeliveredOrder(stored)) {
    return { ok: false as const, reason: "not_eligible" };
  }

  const customerId = await resolveOrderCustomerId(stored);
  if (!customerId) return { ok: false as const, reason: "no_customer" };

  const multiplier = await activePurchaseMultiplier();
  const points = purchasePointsForOrder(stored.order, { multiplier });
  const results: AwardResult[] = [];

  if (points > 0) {
    results.push(
      await awardPoints({
        customerId,
        eventType: LOYALTY_EVENT.PURCHASE,
        points,
        referenceId: stored.orderId,
        orderId: stored.orderId,
        descriptionAr: purchaseActivityLabel(stored.orderId, "ar"),
        descriptionEn: purchaseActivityLabel(stored.orderId, "en"),
        meta: {
          eligibleAmountIQD: eligibleSubtotal(stored.order),
          multiplier,
        },
      }),
    );
  }

  // First purchase bonus — once per customer (referenceId = customerId)
  const alreadyFirst = await prisma.loyaltyLedgerEntry.findUnique({
    where: {
      customerId_eventType_referenceId: {
        customerId,
        eventType: LOYALTY_EVENT.FIRST_PURCHASE,
        referenceId: customerId,
      },
    },
    select: { id: true },
  });
  if (!alreadyFirst) {
    results.push(
      await awardPoints({
        customerId,
        eventType: LOYALTY_EVENT.FIRST_PURCHASE,
        points: LOYALTY_CONFIG.firstPurchase.points,
        referenceId: customerId,
        orderId: stored.orderId,
      }),
    );
  }

  await maybeAwardReferralSuccess(customerId, stored.orderId);

  return { ok: true as const, results };
}

async function maybeAwardReferralSuccess(
  referredCustomerId: string,
  orderId: string,
) {
  const referred = await prisma.customer.findUnique({
    where: { id: referredCustomerId },
    select: { id: true, referredByCustomerId: true },
  });
  if (!referred?.referredByCustomerId) return;
  if (referred.referredByCustomerId === referredCustomerId) return;

  // Only after first eligible purchase for referred user
  const firstPurchase = await prisma.loyaltyLedgerEntry.findFirst({
    where: {
      customerId: referredCustomerId,
      eventType: LOYALTY_EVENT.FIRST_PURCHASE,
      status: "posted",
    },
    select: { id: true, orderId: true },
  });
  if (!firstPurchase) return;
  // Only when this order is the qualifying first purchase order (or first bonus already tied)
  if (firstPurchase.orderId && firstPurchase.orderId !== orderId) {
    // Still allow if referral not yet awarded — first purchase already happened
  }

  const relationKey = `${referred.referredByCustomerId}:${referredCustomerId}`;

  await awardPoints({
    customerId: referred.referredByCustomerId,
    eventType: LOYALTY_EVENT.REFERRAL_SUCCESS_REFERRER,
    points: LOYALTY_CONFIG.successfulReferral.referrerPoints,
    referenceId: relationKey,
    orderId,
    meta: { referredCustomerId },
  });

  await awardPoints({
    customerId: referredCustomerId,
    eventType: LOYALTY_EVENT.REFERRAL_SUCCESS_REFERRED_USER,
    points: LOYALTY_CONFIG.successfulReferral.referredCustomerPoints,
    referenceId: relationKey,
    orderId,
    meta: { referrerId: referred.referredByCustomerId },
  });
}

/**
 * Reverse purchase-related points when an order is returned/cancelled after award.
 */
export async function reverseForOrder(stored: StoredOrder) {
  const customerId = await resolveOrderCustomerId(stored);
  if (!customerId) return { ok: false as const, reason: "no_customer" };

  const purchase = await prisma.loyaltyLedgerEntry.findUnique({
    where: {
      customerId_eventType_referenceId: {
        customerId,
        eventType: LOYALTY_EVENT.PURCHASE,
        referenceId: stored.orderId,
      },
    },
  });

  const results: AwardResult[] = [];

  if (purchase && purchase.status === "posted") {
    results.push(
      await awardPoints({
        customerId,
        eventType: LOYALTY_EVENT.PURCHASE_REVERSAL,
        points: purchase.points,
        referenceId: stored.orderId,
        direction: LOYALTY_DIRECTION.REVERSAL,
        orderId: stored.orderId,
        descriptionAr: `استرجاع طلب #${stored.orderId.slice(-6).toUpperCase()}`,
        descriptionEn: `Order #${stored.orderId.slice(-6).toUpperCase()} reversal`,
      }),
    );
  }

  // If this order was the first-purchase trigger, reverse first-purchase bonus
  const first = await prisma.loyaltyLedgerEntry.findUnique({
    where: {
      customerId_eventType_referenceId: {
        customerId,
        eventType: LOYALTY_EVENT.FIRST_PURCHASE,
        referenceId: customerId,
      },
    },
  });
  if (first?.orderId === stored.orderId && first.status === "posted") {
    results.push(
      await awardPoints({
        customerId,
        eventType: LOYALTY_EVENT.FIRST_PURCHASE_REVERSAL,
        points: first.points,
        referenceId: customerId,
        direction: LOYALTY_DIRECTION.REVERSAL,
        orderId: stored.orderId,
      }),
    );

    // Reverse referral rewards tied to this first purchase
    const referred = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { referredByCustomerId: true },
    });
    if (referred?.referredByCustomerId) {
      const relationKey = `${referred.referredByCustomerId}:${customerId}`;
      const refPoints = LOYALTY_CONFIG.successfulReferral.referrerPoints;
      const welcome = LOYALTY_CONFIG.successfulReferral.referredCustomerPoints;
      results.push(
        await awardPoints({
          customerId: referred.referredByCustomerId,
          eventType: LOYALTY_EVENT.REFERRAL_REVERSAL_REFERRER,
          points: refPoints,
          referenceId: relationKey,
          direction: LOYALTY_DIRECTION.REVERSAL,
          orderId: stored.orderId,
        }),
      );
      results.push(
        await awardPoints({
          customerId,
          eventType: LOYALTY_EVENT.REFERRAL_REVERSAL_REFERRED,
          points: welcome,
          referenceId: relationKey,
          direction: LOYALTY_DIRECTION.REVERSAL,
          orderId: stored.orderId,
        }),
      );
    }
  }

  return { ok: true as const, results };
}

export async function reversePartialPurchasePoints(input: {
  customerId: string;
  orderId: string;
  originalEligibleIQD: number;
  refundedEligibleIQD: number;
}) {
  const purchase = await prisma.loyaltyLedgerEntry.findUnique({
    where: {
      customerId_eventType_referenceId: {
        customerId: input.customerId,
        eventType: LOYALTY_EVENT.PURCHASE,
        referenceId: input.orderId,
      },
    },
  });
  if (!purchase) return { ok: false as const, reason: "no_purchase" };

  const toReverse = proportionalPointsToReverse({
    originalEligibleIQD: input.originalEligibleIQD,
    refundedEligibleIQD: input.refundedEligibleIQD,
    originalPoints: purchase.points,
  });
  if (toReverse <= 0) return { ok: false as const, reason: "zero" };

  return awardPoints({
    customerId: input.customerId,
    eventType: LOYALTY_EVENT.PURCHASE_REVERSAL,
    points: toReverse,
    referenceId: `${input.orderId}:partial:${input.refundedEligibleIQD}`,
    direction: LOYALTY_DIRECTION.REVERSAL,
    orderId: input.orderId,
    meta: {
      partial: true,
      refundedEligibleIQD: input.refundedEligibleIQD,
    },
  });
}

export async function awardVerifiedReview(input: {
  customerId: string;
  orderId: string;
}) {
  return awardPoints({
    customerId: input.customerId,
    eventType: LOYALTY_EVENT.VERIFIED_PRODUCT_REVIEW,
    points: LOYALTY_CONFIG.review.points,
    referenceId: input.orderId,
    orderId: input.orderId,
    monthlyPointLimit: LOYALTY_CONFIG.review.monthlyLimit,
  });
}

export async function claimQrReward(input: {
  customerId: string;
  tokenOrKey: string;
}) {
  const raw = input.tokenOrKey.trim();
  if (!raw) return { ok: false as const, reason: "empty", awarded: 0 as const };

  const now = new Date();
  const campaign = await prisma.loyaltyQrCampaign.findFirst({
    where: {
      OR: [{ secureToken: raw }, { campaignKey: raw }],
    },
  });
  if (!campaign) return { ok: false as const, reason: "not_found", awarded: 0 as const };
  if (!campaign.active) {
    return { ok: false as const, reason: "inactive", awarded: 0 as const };
  }
  if (campaign.startsAt > now || campaign.endsAt < now) {
    return { ok: false as const, reason: "expired", awarded: 0 as const };
  }

  if (campaign.maxClaims != null) {
    const totalClaims = await prisma.loyaltyQrClaim.count({
      where: { campaignId: campaign.id },
    });
    if (totalClaims >= campaign.maxClaims) {
      return { ok: false as const, reason: "max_claims", awarded: 0 as const };
    }
  }

  const existingClaim = await prisma.loyaltyQrClaim.findUnique({
    where: {
      campaignId_customerId: {
        campaignId: campaign.id,
        customerId: input.customerId,
      },
    },
  });
  if (existingClaim) {
    return { ok: false as const, reason: "already_claimed", awarded: 0 as const };
  }

  const perCustomer = campaign.maxClaimsPerCustomer ?? 1;
  if (perCustomer <= 0) {
    return { ok: false as const, reason: "inactive", awarded: 0 as const };
  }

  try {
    const claim = await prisma.loyaltyQrClaim.create({
      data: {
        campaignId: campaign.id,
        customerId: input.customerId,
      },
    });

    const award = await awardPoints({
      customerId: input.customerId,
      eventType: LOYALTY_EVENT.QR_REWARD_CLAIMED,
      points: campaign.points,
      referenceId: campaign.id,
      qrCampaignId: campaign.id,
      descriptionAr: campaign.titleAr || loyaltyEventLabel(LOYALTY_EVENT.QR_REWARD_CLAIMED, "ar"),
      descriptionEn: campaign.titleEn || loyaltyEventLabel(LOYALTY_EVENT.QR_REWARD_CLAIMED, "en"),
    });

    if (award.ok && award.entryId) {
      await prisma.loyaltyQrClaim.update({
        where: { id: claim.id },
        data: { ledgerId: award.entryId },
      });
    }

    return {
      ok: award.ok,
      reason: award.ok ? undefined : "award_failed",
      awarded: award.awarded,
      duplicate: award.ok ? award.duplicate : false,
    };
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return { ok: false as const, reason: "already_claimed", awarded: 0 as const };
    }
    console.error("[loyalty/claimQr]", err);
    return { ok: false as const, reason: "db_error", awarded: 0 as const };
  }
}

export async function linkReferralOnRegister(input: {
  newCustomerId: string;
  referralCode: string | null | undefined;
}) {
  const code = input.referralCode?.trim().toUpperCase();
  if (!code) return { ok: false as const, reason: "no_code" };

  const referrer = await prisma.customer.findFirst({
    where: { referralCode: { equals: code, mode: "insensitive" } },
    select: { id: true, phone: true, email: true },
  });
  if (!referrer) return { ok: false as const, reason: "invalid_code" };
  if (referrer.id === input.newCustomerId) {
    return { ok: false as const, reason: "self_referral" };
  }

  const newbie = await prisma.customer.findUnique({
    where: { id: input.newCustomerId },
    select: {
      id: true,
      phone: true,
      email: true,
      referredByCustomerId: true,
    },
  });
  if (!newbie) return { ok: false as const, reason: "no_customer" };
  if (newbie.referredByCustomerId) {
    return { ok: false as const, reason: "already_referred" };
  }

  // Same phone/email as referrer → reject
  if (
    newbie.phone &&
    referrer.phone &&
    newbie.phone === referrer.phone
  ) {
    return { ok: false as const, reason: "same_phone" };
  }
  if (
    newbie.email &&
    referrer.email &&
    newbie.email.trim().toLowerCase() === referrer.email.trim().toLowerCase()
  ) {
    return { ok: false as const, reason: "same_email" };
  }

  // Prevent simple loops: referrer already referred by newbie
  const loop = await prisma.customer.findFirst({
    where: {
      id: referrer.id,
      referredByCustomerId: newbie.id,
    },
    select: { id: true },
  });
  if (loop) return { ok: false as const, reason: "loop" };

  await prisma.customer.update({
    where: { id: newbie.id },
    data: { referredByCustomerId: referrer.id },
  });

  return { ok: true as const, referrerId: referrer.id };
}

export async function ensureLoyaltyIdentity(customerId: string) {
  await ensureCustomerReferralCode(customerId);
  await prisma.customerLoyaltyBalance.upsert({
    where: { customerId },
    create: { customerId },
    update: {},
  });
}

export async function listLoyaltyActivity(
  customerId: string,
  take = 30,
) {
  return prisma.loyaltyLedgerEntry.findMany({
    where: { customerId, status: "posted" },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countSuccessfulReferrals(customerId: string) {
  return prisma.loyaltyLedgerEntry.count({
    where: {
      customerId,
      eventType: LOYALTY_EVENT.REFERRAL_SUCCESS_REFERRER,
      status: "posted",
    },
  });
}

export async function adminAdjustPoints(input: {
  customerId: string;
  points: number;
  reason: string;
  adminId: string;
}) {
  const points = Math.trunc(input.points);
  if (!points) return { ok: false as const, reason: "zero" };
  const referenceId = `adj:${input.adminId}:${Date.now()}:${Math.abs(points)}`;
  return awardPoints({
    customerId: input.customerId,
    eventType: LOYALTY_EVENT.MANUAL_ADJUSTMENT,
    points,
    referenceId,
    direction: LOYALTY_DIRECTION.ADJUSTMENT,
    descriptionAr: input.reason,
    descriptionEn: input.reason,
    meta: {
      adminId: input.adminId,
      signedPoints: points,
      reason: input.reason,
    },
  });
}
