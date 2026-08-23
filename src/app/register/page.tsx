import { Suspense } from "react";
import { CustomerRegisterForm } from "@/components/auth/CustomerRegisterForm";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-5 py-16 sm:px-8"
      dir="rtl"
    >
      <Suspense
        fallback={
          <p className="t3 text-[var(--muted)]">جارٍ تحميل صفحة التسجيل…</p>
        }
      >
        <CustomerRegisterForm />
      </Suspense>
    </main>
  );
}
