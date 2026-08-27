import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCodeCandidate(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

export async function ensureCustomerReferralCode(
  customerId: string,
): Promise<string> {
  const existing = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateReferralCodeCandidate(8);
    try {
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      if (updated.referralCode) return updated.referralCode;
    } catch {
      // unique collision — retry
    }
  }

  // Extremely unlikely fallback
  const fallback = `V${customerId.replace(/[^a-zA-Z0-9]/g, "").slice(-7).toUpperCase()}`;
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { referralCode: fallback },
    select: { referralCode: true },
  });
  return updated.referralCode!;
}

export function referralPathForCode(code: string): string {
  return `/ref/${encodeURIComponent(code)}`;
}

export function absoluteReferralUrl(code: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${referralPathForCode(code)}`;
}
