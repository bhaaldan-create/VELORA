import { Suspense } from "react";
import OAuthMobileReturnPage from "./OAuthMobileReturnClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div dir="rtl" className="flex min-h-[50vh] items-center justify-center">
          جارٍ إكمال تسجيل الدخول…
        </div>
      }
    >
      <OAuthMobileReturnPage />
    </Suspense>
  );
}
