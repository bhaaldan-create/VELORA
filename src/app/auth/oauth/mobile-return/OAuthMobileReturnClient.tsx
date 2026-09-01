"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildMobileOAuthAppUrl,
  isCapacitorWebView,
} from "@/lib/oauth-mobile-bridge";
import { safeOAuthNext } from "@/lib/oauth";

/**
 * جسر OAuth للتطبيق الأصلي:
 * - داخل متصفح Apple/Google (SFSafariViewController): يعيد التوجيه إلى التطبيق عبر deep link
 * - داخل WebView: يستبدل التذكرة بكوكي جلسة ثم ينقل للحساب
 */
export default function OAuthMobileReturnPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("جارٍ إكمال تسجيل الدخول…");

  useEffect(() => {
    const ticket = search.get("ticket")?.trim();
    const next = safeOAuthNext(search.get("next"));

    async function finish() {
      try {
        if (ticket && !isCapacitorWebView()) {
          setMessage("جارٍ العودة إلى التطبيق…");
          window.location.href = buildMobileOAuthAppUrl(ticket, next);
          window.setTimeout(() => {
            void (async () => {
              try {
                const { Browser } = await import("@capacitor/browser");
                await Browser.close();
              } catch {
                /* browser may already be closed */
              }
            })();
          }, 400);
          return;
        }

        if (ticket && isCapacitorWebView()) {
          const res = await fetch("/api/auth/oauth/mobile-complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ ticket }),
          });
          const data = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok || !data.ok) {
            setMessage(data.error ?? "تعذّر إكمال تسجيل الدخول.");
            return;
          }
        }

        router.replace(next);
      } catch {
        setMessage("تعذّر إكمال تسجيل الدخول. أعيدي المحاولة.");
      }
    }

    void finish();
  }, [search, router]);

  return (
    <div
      dir="rtl"
      className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center"
    >
      <p className="text-[0.95rem] text-[var(--velora-plum-soft)]">{message}</p>
    </div>
  );
}
