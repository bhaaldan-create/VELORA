import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-16 sm:px-8"
      dir="rtl"
    >
      <Suspense
        fallback={
          <p className="t3 text-[var(--muted)]">جارٍ تحميل صفحة الدخول…</p>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
