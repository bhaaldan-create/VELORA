import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";
import { authCopy } from "@/components/auth/auth-copy";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <AuthLayout activeTab="login">
      <Suspense
        fallback={
          <p className="text-center text-[var(--velora-mauve)]">
            {authCopy("ar").loading}
          </p>
        }
      >
        <CustomerLoginForm />
      </Suspense>
    </AuthLayout>
  );
}
