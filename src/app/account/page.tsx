import { Suspense } from "react";
import { AccountSettings } from "@/components/auth/AccountSettings";

export default function AccountPage() {
  return (
    <div className="overflow-x-clip bg-[var(--account-bg)] px-5 py-10 sm:px-8 sm:py-14">
      <Suspense
        fallback={
          <p className="text-center text-[0.9rem] text-[var(--account-muted)]">
            جارٍ تحميل مساحتكِ…
          </p>
        }
      >
        <AccountSettings />
      </Suspense>
    </div>
  );
}
