import { prisma } from "@/lib/db";
import type { VeloraCardConfig } from "@/lib/my-velora/types";

const CONFIG_ID = "default";

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

export async function getVeloraCardConfig(): Promise<VeloraCardConfig> {
  try {
    const row = await prisma.veloraCardConfig.findUnique({
      where: { id: CONFIG_ID },
    });
    if (!row) return structuredClone(DEFAULT_VELORA_CARD_CONFIG);
    return mergeVeloraCardConfig(row.data);
  } catch {
    return structuredClone(DEFAULT_VELORA_CARD_CONFIG);
  }
}

export async function saveVeloraCardConfig(
  data: VeloraCardConfig,
): Promise<VeloraCardConfig> {
  const merged = mergeVeloraCardConfig(data);
  await prisma.veloraCardConfig.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, data: merged },
    update: { data: merged },
  });
  return merged;
}
