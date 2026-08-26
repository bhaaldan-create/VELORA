import { prisma } from "@/lib/db";
import { getClubConfig } from "@/lib/club/config";
import { computeMemberState } from "@/lib/club/compute";
import { listStoredOrders } from "@/lib/orders";
import { orderBelongsToCustomer } from "@/lib/my-velora/eligibility";
import {
  getCustomerJourneyStats,
  syncCustomerAchievements,
} from "@/lib/my-velora/journey";
import { ACHIEVEMENT_DEFS } from "@/lib/my-velora/types";
import {
  ensurePassportIdentity,
  ensurePassportSeed,
  getPassportConfig,
} from "@/lib/passport/number";
import {
  clubTierToPassportLevel,
  EMPTY_BEAUTY_PROFILE,
  type BeautyProfileData,
} from "@/lib/passport/types";
import { getGovernorateLabel } from "@/lib/passport/governorates";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

export function parseBeautyProfile(row: {
  skinType: string;
  skinConcernsJson: unknown;
  beautyGoalsJson: unknown;
  makeupStyle: string;
  preferredFinish: string;
  favoriteCategoriesJson: unknown;
  preferredBrandsJson: unknown;
} | null): BeautyProfileData {
  if (!row) return { ...EMPTY_BEAUTY_PROFILE };
  return {
    skinType: row.skinType || "",
    skinConcerns: asStringArray(row.skinConcernsJson),
    beautyGoals: asStringArray(row.beautyGoalsJson),
    makeupStyle: row.makeupStyle || "",
    preferredFinish: row.preferredFinish || "",
    favoriteCategories: asStringArray(row.favoriteCategoriesJson),
    preferredBrands: asStringArray(row.preferredBrandsJson),
  };
}

export type PassportPayload = {
  passportNumber: string;
  passportToken: string;
  fullName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  governorate: string | null;
  governorateLabelAr: string | null;
  governorateLabelEn: string | null;
  memberSinceYear: number;
  passportOpenedAt: string | null;
  /** Club points shown as XP inside Passport only */
  xp: number;
  pointsToNext: number;
  progressRatio: number;
  level: {
    id: string;
    clubTierId: string;
    nameEn: string;
    nameAr: string;
    mark: string;
  };
  nextLevel: {
    id: string;
    nameEn: string;
    nameAr: string;
  } | null;
  beautyProfile: BeautyProfileData;
  journey: {
    totalOrders: number;
    totalProducts: number;
    brandsTried: number;
    totalPoints: number;
  };
  achievements: Array<{
    key: string;
    nameEn: string;
    nameAr: string;
    unlocked: boolean;
    unlockedAt: string | null;
  }>;
  wishlistCount: number;
  config: {
    showQrCode: boolean;
    publicShareEnabled: boolean;
    birthdayFeatureEnabled: boolean;
  };
  isBirthdayToday: boolean;
  publicUrl: string;
};

function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://velorabeautyiq.me"
  ).replace(/\/$/, "");
}

function isBirthdayToday(dob: Date | null): boolean {
  if (!dob) return false;
  const now = new Date();
  return (
    dob.getUTCDate() === now.getUTCDate() &&
    dob.getUTCMonth() === now.getUTCMonth()
  );
}

/**
 * Build full authenticated Passport payload from existing Club + MY VELORA data.
 * Never invents fake XP/orders/achievements.
 */
export async function getPassportForCustomer(
  customerId: string,
): Promise<PassportPayload | null> {
  await ensurePassportSeed();
  const identity = await ensurePassportIdentity(customerId);
  if (!identity) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      dateOfBirth: true,
      governorate: true,
      passportOpenedAt: true,
      createdAt: true,
      beautyProfile: true,
    },
  });
  if (!customer) return null;

  const [clubConfig, passportConfig, allOrders, wishlistCount] =
    await Promise.all([
      getClubConfig(),
      getPassportConfig(),
      listStoredOrders(),
      prisma.customerWishlistItem.count({ where: { customerId } }),
    ]);

  const email = customer.email.trim().toLowerCase();
  const owned = allOrders.filter((o) =>
    orderBelongsToCustomer(o, customerId, email),
  );

  const member = computeMemberState({
    config: clubConfig,
    customerId,
    fullName: customer.fullName,
    orders: owned.map((o) => ({
      orderId: o.orderId,
      savedAt: o.savedAt,
      total: o.order.total ?? o.order.subtotal ?? 0,
      status: o.status,
    })),
  });

  const level = clubTierToPassportLevel(member.tierId);
  const nextLevel = member.nextTierId
    ? clubTierToPassportLevel(member.nextTierId)
    : null;

  await syncCustomerAchievements(customerId, email).catch(() => undefined);
  const [journey, unlocked] = await Promise.all([
    getCustomerJourneyStats(customerId, email),
    prisma.veloraAchievement.findMany({
      where: { customerId },
      select: { achievementKey: true, unlockedAt: true },
    }),
  ]);
  const unlockedMap = new Map(
    unlocked.map((a) => [a.achievementKey, a.unlockedAt.toISOString()]),
  );

  const achievements = ACHIEVEMENT_DEFS.map((def) => ({
    key: def.key,
    nameEn: def.nameEn,
    nameAr: def.nameAr,
    unlocked: unlockedMap.has(def.key),
    unlockedAt: unlockedMap.get(def.key) ?? null,
  }));

  return {
    passportNumber: identity.passportNumber,
    passportToken: identity.passportToken,
    fullName: customer.fullName,
    avatarUrl: customer.avatarUrl,
    dateOfBirth: customer.dateOfBirth
      ? customer.dateOfBirth.toISOString().slice(0, 10)
      : null,
    governorate: customer.governorate,
    governorateLabelAr: getGovernorateLabel(customer.governorate, "ar"),
    governorateLabelEn: getGovernorateLabel(customer.governorate, "en"),
    memberSinceYear: customer.createdAt.getFullYear(),
    passportOpenedAt: customer.passportOpenedAt?.toISOString() ?? null,
    xp: member.points,
    pointsToNext: member.pointsToNext,
    progressRatio: member.progressRatio,
    level: {
      id: level.id,
      clubTierId: level.clubTierId,
      nameEn: level.nameEn,
      nameAr: level.nameAr,
      mark: level.mark,
    },
    nextLevel: nextLevel
      ? {
          id: nextLevel.id,
          nameEn: nextLevel.nameEn,
          nameAr: nextLevel.nameAr,
        }
      : null,
    beautyProfile: parseBeautyProfile(customer.beautyProfile),
    journey: {
      totalOrders: journey.totalOrders,
      totalProducts: journey.totalProducts,
      brandsTried: journey.brandsTried,
      totalPoints: journey.totalPoints,
    },
    achievements,
    wishlistCount,
    config: {
      showQrCode: passportConfig.showQrCode,
      publicShareEnabled: passportConfig.publicShareEnabled,
      birthdayFeatureEnabled: passportConfig.birthdayFeatureEnabled,
    },
    isBirthdayToday:
      passportConfig.birthdayFeatureEnabled &&
      isBirthdayToday(customer.dateOfBirth),
    publicUrl: `${siteOrigin()}/passport/${identity.passportToken}`,
  };
}

export async function markPassportOpened(customerId: string) {
  await prisma.customer.updateMany({
    where: { id: customerId, passportOpenedAt: null },
    data: { passportOpenedAt: new Date() },
  });
}
