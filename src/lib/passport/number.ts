import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import type { PassportConfig } from "@/lib/passport/types";
import { DEFAULT_PASSPORT_CONFIG } from "@/lib/passport/types";

/** Public-safe passport number: VL-2026-008421 */
export function formatPassportNumber(opts: {
  year: number;
  sequence: number;
  prefix?: string;
}) {
  const prefix = (opts.prefix || "VL").toUpperCase().slice(0, 4);
  const seq = String(Math.abs(opts.sequence) % 1_000_000).padStart(6, "0");
  return `${prefix}-${opts.year}-${seq}`;
}

function hashToSequence(input: string): number {
  const hex = createHash("sha256").update(input).digest("hex").slice(0, 8);
  return parseInt(hex, 16) % 1_000_000;
}

export function createPassportToken() {
  return randomBytes(18).toString("base64url");
}

/**
 * Assign stable passportNumber + passportToken once.
 * Does not overwrite existing values.
 */
export async function ensurePassportIdentity(customerId: string) {
  const row = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      passportNumber: true,
      passportToken: true,
      createdAt: true,
    },
  });
  if (!row) return null;

  if (row.passportNumber && row.passportToken) {
    return {
      passportNumber: row.passportNumber,
      passportToken: row.passportToken,
    };
  }

  const year = row.createdAt.getFullYear();
  let passportNumber =
    row.passportNumber ||
    formatPassportNumber({
      year,
      sequence: hashToSequence(customerId),
      prefix: DEFAULT_PASSPORT_CONFIG.numberPrefix,
    });

  // Collision retry (extremely rare)
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.customer.findFirst({
      where: {
        passportNumber,
        NOT: { id: customerId },
      },
      select: { id: true },
    });
    if (!clash) break;
    passportNumber = formatPassportNumber({
      year,
      sequence: hashToSequence(`${customerId}:${i}:${Date.now()}`),
    });
  }

  const passportToken = row.passportToken || createPassportToken();

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      passportNumber: row.passportNumber || passportNumber,
      passportToken: row.passportToken || passportToken,
    },
    select: { passportNumber: true, passportToken: true },
  });

  return {
    passportNumber: updated.passportNumber!,
    passportToken: updated.passportToken!,
  };
}

export async function getPassportConfig(): Promise<PassportConfig> {
  const row = await prisma.veloraPassportConfig.findUnique({
    where: { id: "default" },
  });
  if (!row?.data || typeof row.data !== "object") {
    return { ...DEFAULT_PASSPORT_CONFIG };
  }
  return {
    ...DEFAULT_PASSPORT_CONFIG,
    ...(row.data as Partial<PassportConfig>),
  };
}

export async function ensurePassportSeed() {
  await prisma.veloraPassportConfig.upsert({
    where: { id: "default" },
    create: { id: "default", data: DEFAULT_PASSPORT_CONFIG },
    update: {},
  });
}

export async function savePassportConfig(
  config: Partial<PassportConfig>,
): Promise<PassportConfig> {
  await ensurePassportSeed();
  const current = await getPassportConfig();
  const merged: PassportConfig = {
    ...current,
    ...config,
    version: current.version,
  };
  await prisma.veloraPassportConfig.update({
    where: { id: "default" },
    data: { data: merged },
  });
  return merged;
}
