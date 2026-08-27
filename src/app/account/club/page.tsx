import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BeautyClubExperience } from "@/components/club/BeautyClubExperience";
import { isCustomerFeatureEnabled } from "@/lib/customer-features";
import "./club.css";

export default function BeautyClubPage() {
  if (!isCustomerFeatureEnabled("club")) {
    redirect("/account");
  }

  return (
    <Suspense
      fallback={
        <div className="club-shell">
          <div className="club-frame">
            <div className="club-skeleton" />
          </div>
        </div>
      }
    >
      <BeautyClubExperience />
    </Suspense>
  );
}
