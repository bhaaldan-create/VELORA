"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authCopy } from "@/components/auth/auth-copy";
import { safeNext } from "@/components/auth/auth-utils";
import type { Locale } from "@/i18n/dictionaries";

export function AuthTabs({ active, locale }: { active: "login" | "register"; locale: Locale }) {
  const search = useSearchParams();
  const nextQ = `?next=${encodeURIComponent(safeNext(search.get("next")))}`;
  const copy = authCopy(locale);
  const isLogin = active === "login";

  return (
    <div className="auth-tabs" role="tablist" aria-label={copy.tabLogin}>
      <Link
        href={`/login${nextQ}`}
        role="tab"
        aria-selected={isLogin}
        className="auth-tab"
      >
        {copy.tabLogin}
      </Link>
      <Link
        href={`/register${nextQ}`}
        role="tab"
        aria-selected={!isLogin}
        className="auth-tab"
      >
        {copy.tabSignup}
      </Link>
    </div>
  );
}
