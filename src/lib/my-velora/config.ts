import { prisma } from "@/lib/db";
import {
  DEFAULT_VELORA_CARD_CONFIG,
  mergeVeloraCardConfig,
} from "@/lib/my-velora/default-config";
import type { VeloraCardConfig } from "@/lib/my-velora/types";

const CONFIG_ID = "default";

export { DEFAULT_VELORA_CARD_CONFIG, mergeVeloraCardConfig };

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
