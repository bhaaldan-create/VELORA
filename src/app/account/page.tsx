import { Suspense } from "react";
import { AccountSettings } from "@/components/auth/AccountSettings";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16" dir="rtl">
      <Suspense
        fallback={<p className="t3 text-[var(--muted)]">جارٍ تحميل حسابكِ…</p>}
      >
        <AccountSettings />
      </Suspense>
    </main>
  );
}
