import { prisma } from "@/lib/db";
import type { OAuthProfile, OAuthProvider } from "@/lib/oauth";

type CustomerAuthSlice = {
  passwordHash: string | null;
  authProvider: string;
  googleId: string | null;
  appleId: string | null;
};

function resolveAuthProvider(
  existing: CustomerAuthSlice,
  newProvider: OAuthProvider,
): string {
  const willHaveGoogle =
    Boolean(existing.googleId) || newProvider === "google";
  const willHaveApple = Boolean(existing.appleId) || newProvider === "apple";

  if (existing.passwordHash) return "linked";
  if (willHaveGoogle && willHaveApple) return "linked";
  return newProvider;
}

/**
 * إيجاد أو إنشاء زبون من ملف OAuth، مع ربط الحساب إن وُجد نفس البريد.
 */
export async function upsertCustomerFromOAuth(profile: OAuthProfile) {
  const providerIdField =
    profile.provider === "google" ? "googleId" : "appleId";

  const byProvider = await prisma.customer.findUnique({
    where:
      profile.provider === "google"
        ? { googleId: profile.providerUserId }
        : { appleId: profile.providerUserId },
  });
  if (byProvider) {
    const linkedProvider = resolveAuthProvider(byProvider, profile.provider);
    const needsUpdate =
      (byProvider.fullName !== profile.fullName && profile.fullName) ||
      byProvider.authProvider !== linkedProvider;

    if (needsUpdate) {
      return prisma.customer.update({
        where: { id: byProvider.id },
        data: {
          fullName: byProvider.fullName || profile.fullName,
          authProvider: linkedProvider,
        },
      });
    }
    return byProvider;
  }

  const byEmail = await prisma.customer.findUnique({
    where: { email: profile.email },
  });
  if (byEmail) {
    const linkedProvider = resolveAuthProvider(byEmail, profile.provider);
    return prisma.customer.update({
      where: { id: byEmail.id },
      data: {
        [providerIdField]: profile.providerUserId,
        authProvider: linkedProvider,
        fullName: byEmail.fullName || profile.fullName,
      },
    });
  }

  return prisma.customer.create({
    data: {
      email: profile.email,
      fullName: profile.fullName,
      passwordHash: null,
      phone: null,
      phoneVerified: false,
      address: "",
      [providerIdField]: profile.providerUserId,
      authProvider: profile.provider,
    },
  }).then(async (customer) => {
    try {
      const {
        awardAccountCreated,
        ensureLoyaltyIdentity,
        linkReferralOnRegister,
      } = await import("@/lib/loyalty/award");
      const { cookies } = await import("next/headers");
      const { REFERRAL_COOKIE } = await import("@/lib/loyalty/config");
      await ensureLoyaltyIdentity(customer.id);
      await awardAccountCreated(customer.id);
      const jar = await cookies();
      const ref = jar.get(REFERRAL_COOKIE)?.value;
      await linkReferralOnRegister({
        newCustomerId: customer.id,
        referralCode: ref,
      });
    } catch (err) {
      console.error("[oauth] loyalty", err);
    }
    return customer;
  });
}

export function oauthErrorRedirect(
  provider: OAuthProvider,
  message: string,
  nextPath = "/account",
) {
  const base = provider === "google" ? "/login" : "/login";
  const params = new URLSearchParams({
    oauth_error: message,
    next: nextPath,
  });
  return `${base}?${params}`;
}
