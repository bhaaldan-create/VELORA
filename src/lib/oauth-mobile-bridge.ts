import { NextResponse } from "next/server";
import { safeOAuthNext } from "@/lib/oauth-paths";

/** يطابق CFBundleURLSchemes في ios/App/App/Info.plist */
export const OAUTH_APP_URL_SCHEME = "beauty.velora.app";

export const VELORA_OAUTH_RETURN_EVENT = "velora-oauth-return";

export function isCapacitorWebView() {
  if (typeof window === "undefined") return false;
  try {
    const cap = (
      window as Window & {
        Capacitor?: {
          isNativePlatform?: () => boolean;
          getPlatform?: () => string;
        };
      }
    ).Capacitor;
    if (cap?.isNativePlatform?.()) return true;
    if (cap?.getPlatform && cap.getPlatform() !== "web") return true;
  } catch {
    /* ignore */
  }
  try {
    if (
      /Capacitor/i.test(navigator.userAgent) ||
      Boolean(
        (
          window as Window & {
            webkit?: { messageHandlers?: { bridge?: unknown } };
          }
        ).webkit?.messageHandlers?.bridge,
      )
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function buildMobileOAuthAppUrl(ticket: string, nextPath: string) {
  const next = safeOAuthNext(nextPath);
  const params = new URLSearchParams({
    ticket,
    next,
  });
  return `${OAUTH_APP_URL_SCHEME}://oauth/callback?${params.toString()}`;
}

export function buildMobileOAuthErrorUrl(message: string, nextPath: string) {
  const params = new URLSearchParams({
    oauth_error: message,
    next: safeOAuthNext(nextPath),
  });
  return `${OAUTH_APP_URL_SCHEME}://oauth/error?${params.toString()}`;
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

/** خطأ OAuth يُعاد إلى التطبيق عبر custom scheme */
export function parseMobileOAuthErrorUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== `${OAUTH_APP_URL_SCHEME}:`) return null;
    if (url.hostname !== "oauth") return null;
    if (!url.pathname.startsWith("/error")) return null;
    const message = url.searchParams.get("oauth_error")?.trim();
    if (!message) return null;
    return {
      message,
      next: safeOAuthNext(url.searchParams.get("next")),
    };
  } catch {
    return null;
  }
}

/**
 * HTML handoff — 302 إلى custom scheme غالباً يُتجاهل داخل in-app browser.
 * صفحة HTML مع location.replace أكثر موثوقية لفتح التطبيق.
 */
export function mobileOAuthHandoffResponse(appUrl: string) {
  const jsUrl = JSON.stringify(appUrl);
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/>
<title>VELORA</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F8F4F1;color:#3d2640;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:1.5rem}
@media (prefers-color-scheme: dark){body{background:#141114;color:#e8dce0}a{color:#e2d2d5}}
a{color:#3d2640;font-weight:600}
p{margin:0.5rem 0;line-height:1.6}
</style>
</head>
<body>
<p>جارٍ العودة إلى تطبيق VELORA…</p>
<p><a id="open" href=${jsUrl}>اضغطي هنا إن لم يُفتح التطبيق تلقائياً</a></p>
<script>
(function(){
  var u=${jsUrl};
  try { window.location.replace(u); } catch(e) {
    try { window.location.href = u; } catch(_e) {}
  }
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

/** يستبدل التذكرة بكوكي جلسة داخل WebView عبر إعادة توجيه من الخادم */
export function mobileOAuthCompleteUrl(ticket: string, nextPath: string) {
  const next = safeOAuthNext(nextPath);
  const params = new URLSearchParams({ ticket, next });
  return `/api/auth/oauth/mobile-complete?${params.toString()}`;
}
