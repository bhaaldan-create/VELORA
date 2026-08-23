import { Suspense } from "react";
import { AccountSettings } from "@/components/auth/AccountSettings";
import "./account.css";

export default function AccountPage() {
  return (
    <div className="acc-page overflow-x-clip px-4 py-8 sm:px-8 sm:py-12">
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
