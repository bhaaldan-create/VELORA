/** مسارات OAuth — بدون تبعيات Node (آمن للعميل) */

export function safeOAuthNext(raw: string | null | undefined) {
  if (!raw) return "/account";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  if (raw.startsWith("/admin")) return "/account";
  return raw;
}

/** جسر الجلسة بعد OAuth — يفعّل الكوكي عبر fetch من نفس المصدر */
export const OAUTH_SESSION_BRIDGE_PATH = "/auth/oauth/session-bridge";

/** مسار قديم — يُحوَّل تلقائياً إلى session-bridge */
export const OAUTH_MOBILE_RETURN_PATH = "/auth/oauth/mobile-return";

export function isOAuthSessionBridge(nextPath: string) {
  const base = nextPath.split("?")[0] ?? nextPath;
  return (
    base === OAUTH_SESSION_BRIDGE_PATH || base === OAUTH_MOBILE_RETURN_PATH
  );
}
