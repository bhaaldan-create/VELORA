import { Suspense } from "react";
import OAuthSessionBridgeClient from "./OAuthSessionBridgeClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div dir="rtl" className="flex min-h-[50vh] items-center justify-center">
          جارٍ إكمال تسجيل الدخول…
        </div>
      }
    >
      <OAuthSessionBridgeClient />
    </Suspense>
  );
}
