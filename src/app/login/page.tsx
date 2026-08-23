import { Suspense } from "react";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-5 py-16 sm:px-8"
      dir="rtl"
    >
      <Suspense
        fallback={
          <p className="t3 text-[var(--muted)]">جارٍ تحميل صفحة الدخول…</p>
        }
      >
        <CustomerLoginForm />
      </Suspense>
    </main>
  );
}
