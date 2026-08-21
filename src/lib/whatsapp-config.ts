import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type WhatsAppRuntimeConfig = {
  provider: "green-api" | "ultramsg" | "none";
  companyPhone: string;
  greenApiInstanceId?: string;
  greenApiToken?: string;
  greenApiUrl?: string;
  ultramsgInstanceId?: string;
  ultramsgToken?: string;
  updatedAt?: string;
};

const CONFIG_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(CONFIG_DIR, "whatsapp-config.json");

const DEFAULT_CONFIG: WhatsAppRuntimeConfig = {
  provider: "none",
  companyPhone: "07830000492",
};

export async function readWhatsAppRuntimeConfig(): Promise<WhatsAppRuntimeConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<WhatsAppRuntimeConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      companyPhone: parsed.companyPhone?.trim() || DEFAULT_CONFIG.companyPhone,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeWhatsAppRuntimeConfig(
  input: WhatsAppRuntimeConfig,
): Promise<WhatsAppRuntimeConfig> {
  await mkdir(CONFIG_DIR, { recursive: true });
  const next: WhatsAppRuntimeConfig = {
    ...input,
    companyPhone: input.companyPhone?.trim() || "07830000492",
    updatedAt: new Date().toISOString(),
  };
  await writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}
