import { safeOAuthNext } from "@/lib/oauth";

/** يطابق CFBundleURLSchemes في ios/App/App/Info.plist */
export const OAUTH_APP_URL_SCHEME = "beauty.velora.app";

export function isCapacitorWebView() {
  if (typeof window === "undefined") return false;
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean };
    }
  ).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function buildMobileOAuthAppUrl(ticket: string, nextPath: string) {
  const next = safeOAuthNext(nextPath);
  const params = new URLSearchParams({
    ticket,
    next,
  });
  return `${OAUTH_APP_URL_SCHEME}://oauth/callback?${params.toString()}`;
}

export function parseMobileOAuthAppUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== `${OAUTH_APP_URL_SCHEME}:`) return null;
    if (url.hostname !== "oauth") return null;
    if (!url.pathname.startsWith("/callback")) return null;

    const ticket = url.searchParams.get("ticket")?.trim();
    if (!ticket) return null;

    return {
      ticket,
      next: safeOAuthNext(url.searchParams.get("next")),
    };
  } catch {
    return null;
  }
}

/** يستبدل التذكرة بكوكي جلسة داخل WebView عبر إعادة توجيه من الخادم */
export function mobileOAuthCompleteUrl(ticket: string, nextPath: string) {
  const next = safeOAuthNext(nextPath);
  const params = new URLSearchParams({ ticket, next });
  return `/api/auth/oauth/mobile-complete?${params.toString()}`;
}
