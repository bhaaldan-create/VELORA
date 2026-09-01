"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { safeOAuthNext } from "@/lib/oauth-paths";

/**
 * بعد OAuth (خصوصاً Apple form_post) قد لا يُحفظ الكوكي على redirect في WebView.
 * هذه الصفحة تستبدل التذكرة بجلسة عبر fetch من نفس المصدر.
 */
export default function OAuthSessionBridgeClient() {
  const search = useSearchParams();
  const router = useRouter();
  const { refresh } = useCustomerAuth();
  const [message, setMessage] = useState("جارٍ إكمال تسجيل الدخول…");

  useEffect(() => {
    const ticket = search.get("ticket")?.trim();
    const next = safeOAuthNext(search.get("next"));

    async function finish() {
      try {
        const meRes = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const me = (await meRes.json()) as {
          customer?: { id: string } | null;
        };
        if (me.customer) {
          router.replace(next);
          return;
        }

        if (!ticket) {
          setMessage("تعذّر إكمال تسجيل الدخول. أعيدي المحاولة من صفحة الدخول.");
          return;
        }

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
