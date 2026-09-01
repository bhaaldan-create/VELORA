"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeOAuthNext } from "@/lib/oauth-paths";

/** توافق مع الروابط القديمة — يوجّه إلى session-bridge */
export default function OAuthMobileReturnPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("جارٍ إكمال تسجيل الدخول…");

  useEffect(() => {
    const ticket = search.get("ticket");
    const next = safeOAuthNext(search.get("next"));
    const params = new URLSearchParams();
    if (ticket) params.set("ticket", ticket);
    params.set("next", next);
    router.replace(`/auth/oauth/session-bridge?${params.toString()}`);
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
