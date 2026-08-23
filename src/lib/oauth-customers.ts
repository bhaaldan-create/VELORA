import { prisma } from "@/lib/db";
import type { OAuthProfile, OAuthProvider } from "@/lib/oauth";

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
    if (byProvider.fullName !== profile.fullName && profile.fullName) {
      return prisma.customer.update({
        where: { id: byProvider.id },
        data: {
          fullName: byProvider.fullName || profile.fullName,
          authProvider:
            byProvider.passwordHash && byProvider.authProvider === "password"
              ? "linked"
              : profile.provider,
        },
      });
    }
    return byProvider;
  }

  const byEmail = await prisma.customer.findUnique({
    where: { email: profile.email },
  });
  if (byEmail) {
    return prisma.customer.update({
      where: { id: byEmail.id },
      data: {
        [providerIdField]: profile.providerUserId,
        authProvider: byEmail.passwordHash ? "linked" : profile.provider,
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
