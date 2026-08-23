import { prisma } from "@/lib/db";
import { DEFAULT_CLUB_CONFIG } from "@/lib/club/default-config";
import type { ClubConfig } from "@/lib/club/types";

const CONFIG_ID = "default";

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/** Merge stored JSON over defaults so partial admin edits stay valid. */
export function mergeClubConfig(stored: unknown): ClubConfig {
  if (!isObject(stored)) return structuredClone(DEFAULT_CLUB_CONFIG);
  const base = structuredClone(DEFAULT_CLUB_CONFIG);
  return {
    ...base,
    ...stored,
    tiers: Array.isArray(stored.tiers) ? (stored.tiers as ClubConfig["tiers"]) : base.tiers,
    rewards: Array.isArray(stored.rewards)
      ? (stored.rewards as ClubConfig["rewards"])
      : base.rewards,
    privileges: Array.isArray(stored.privileges)
      ? (stored.privileges as ClubConfig["privileges"])
      : base.privileges,
    earnCards: Array.isArray(stored.earnCards)
      ? (stored.earnCards as ClubConfig["earnCards"])
      : base.earnCards,
    passportBrands: Array.isArray(stored.passportBrands)
      ? (stored.passportBrands as ClubConfig["passportBrands"])
      : base.passportBrands,
    mysteryPool: Array.isArray(stored.mysteryPool)
      ? (stored.mysteryPool as ClubConfig["mysteryPool"])
      : base.mysteryPool,
    priveBenefitsEn: Array.isArray(stored.priveBenefitsEn)
      ? (stored.priveBenefitsEn as string[])
      : base.priveBenefitsEn,
    priveBenefitsAr: Array.isArray(stored.priveBenefitsAr)
      ? (stored.priveBenefitsAr as string[])
      : base.priveBenefitsAr,
  } as ClubConfig;
}

export async function getClubConfig(): Promise<ClubConfig> {
  try {
    const row = await prisma.clubProgramConfig.findUnique({
      where: { id: CONFIG_ID },
    });
    if (!row) return structuredClone(DEFAULT_CLUB_CONFIG);
    return mergeClubConfig(row.data);
  } catch {
    return structuredClone(DEFAULT_CLUB_CONFIG);
  }
}

export async function saveClubConfig(data: ClubConfig): Promise<ClubConfig> {
  const merged = mergeClubConfig(data);
  await prisma.clubProgramConfig.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, data: merged },
    update: { data: merged },
  });
  return merged;
}
