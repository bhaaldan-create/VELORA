import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main
      className="admin-os flex min-h-dvh items-center justify-center px-5 py-12"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-[12px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[var(--admin-shadow-md)] sm:p-8">
        <Suspense
          fallback={
            <p className="text-[13px] text-[var(--admin-text-muted)]">
              جارٍ تحميل صفحة الدخول…
            </p>
          }
        >
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
