/** مسارات OAuth — بدون تبعيات Node (آمن للعميل) */

export function safeOAuthNext(raw: string | null | undefined) {
  if (!raw) return "/account";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  if (raw.startsWith("/admin")) return "/account";
  return raw;
}

/** مسار العودة بعد OAuth داخل تطبيق Capacitor */
export const OAUTH_MOBILE_RETURN_PATH = "/auth/oauth/mobile-return";

export function isMobileOAuthReturn(nextPath: string) {
  return nextPath === OAUTH_MOBILE_RETURN_PATH;
}
