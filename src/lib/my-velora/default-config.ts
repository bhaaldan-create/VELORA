import type { VeloraCardConfig } from "@/lib/my-velora/types";

export const DEFAULT_VELORA_CARD_CONFIG: VeloraCardConfig = {
  version: 1,
  referralRewardPoints: 100,
  referralMinOrderIqd: 50_000,
  referralMaxMonthlyRewards: 3,
  referralExpirationDays: 90,
  reviewRewardPoints: 50,
  showQrCode: true,
  shareEarnEnabled: true,
};

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export function mergeVeloraCardConfig(stored: unknown): VeloraCardConfig {
  if (!isObject(stored)) return structuredClone(DEFAULT_VELORA_CARD_CONFIG);
  const base = structuredClone(DEFAULT_VELORA_CARD_CONFIG);
  return { ...base, ...stored } as VeloraCardConfig;
}
