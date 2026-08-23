import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CustomerRegisterForm } from "@/components/auth/CustomerRegisterForm";
import { authCopy } from "@/components/auth/auth-copy";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <AuthLayout activeTab="register">
      <Suspense
        fallback={
          <p className="text-center text-[var(--velora-mauve)]">
            {authCopy("ar").loading}
          </p>
        }
      >
        <CustomerRegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
