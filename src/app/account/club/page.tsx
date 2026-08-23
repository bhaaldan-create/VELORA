import { Suspense } from "react";
import { BeautyClubExperience } from "@/components/club/BeautyClubExperience";
import "./club.css";

export default function BeautyClubPage() {
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
