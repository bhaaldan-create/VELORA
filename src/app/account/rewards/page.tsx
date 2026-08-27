import { Suspense } from "react";
import { RewardsExperience } from "@/components/loyalty/RewardsExperience";
import "@/components/loyalty/loyalty.css";
import "../account.css";

export default function AccountRewardsPage() {
  return (
    <div className="acc-page overflow-x-clip px-4 py-6 sm:px-8 sm:py-10">
      <Suspense
        fallback={
          <p className="text-center text-[0.9rem] text-[var(--account-muted)]">
            جارٍ تحميل مكافآتكِ…
          </p>
        }
      >
        <RewardsExperience />
      </Suspense>
    </div>
  );
}
