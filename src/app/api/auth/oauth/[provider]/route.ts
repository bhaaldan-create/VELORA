import { NextResponse } from "next/server";
import {
  buildAppleAuthUrl,
  buildGoogleAuthUrl,
  createOAuthState,
  isOAuthProviderConfigured,
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
  safeOAuthNext,
  type OAuthProvider,
} from "@/lib/oauth";

function parseProvider(raw: string): OAuthProvider | null {
  if (raw === "google" || raw === "apple") return raw;
  return null;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await ctx.params;
  const provider = parseProvider(raw);
  if (!provider) {
    return NextResponse.json({ ok: false, error: "مزود غير معروف." }, { status: 404 });
  }

  if (!isOAuthProviderConfigured(provider)) {
    const name = provider === "google" ? "Google" : "Apple";
    return NextResponse.redirect(
      new URL(
        `/login?oauth_error=${encodeURIComponent(
          `${name} غير مفعّل بعد. أضيفي مفاتيح OAuth في إعدادات البيئة.`,
        )}`,
        req.url,
      ),
    );
  }

  const url = new URL(req.url);
  const next = safeOAuthNext(url.searchParams.get("next"));
  const state = await createOAuthState(next);
  const authUrl =
    provider === "google"
      ? await buildGoogleAuthUrl(state)
      : await buildAppleAuthUrl(state);

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions());
  return res;
}
