"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mobileOAuthCompleteUrl } from "@/lib/oauth-mobile-bridge";
import { safeOAuthNext } from "@/lib/oauth";

/** احتياطي لجلسات OAuth القديمة — يتحقق من الجلسة أو يستبدل التذكرة */
export default function OAuthMobileReturnPage() {
  const search = useSearchParams();
  const router = useRouter();
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
          ok?: boolean;
          customer?: { id: string } | null;
        };
        if (me.customer) {
          router.replace(next);
          return;
        }

        if (ticket) {
          window.location.replace(mobileOAuthCompleteUrl(ticket, next));
          return;
        }

        setMessage("تعذّر إكمال تسجيل الدخول. أعيدي المحاولة من صفحة الدخول.");
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
