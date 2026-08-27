"use client";

import type { PassportPayload } from "@/lib/passport/ensure";
import { PassportDocumentShell } from "../shell/PassportDocumentShell";
import { PassportFieldBlock } from "./PassportFieldBlock";
import { PassportPortraitFrame } from "./PassportPortraitFrame";
import { PassportMembershipRow } from "./PassportMembershipRow";
import { PassportVerificationPanel } from "./PassportVerificationPanel";
import { formatPassportDob, passportInitials } from "../utils";

type Props = {
  ar?: boolean;
  passport: PassportPayload;
  onChangePhoto: () => void;
};

export function PassportIdentityPage({
  ar = false,
  passport,
  onChangePhoto,
}: Props) {
  const levelName = ar ? passport.level.nameAr : passport.level.nameEn;
  const govEn = passport.governorateLabelEn || "—";
  const govAr = passport.governorateLabelAr || "";
  const govDisplay = govAr && !ar ? `${govEn} · ${govAr}` : ar ? govAr || "—" : govEn;

  return (
    <div className="vp-identity-stage">
      <PassportDocumentShell
        pageLabel={undefined}
        passportNumber={passport.passportNumber}
      >
        <div className="vp-identity-composition">
          <div className="vp-identity-main">
            <PassportPortraitFrame
              avatarUrl={passport.avatarUrl}
              initials={passportInitials(passport.fullName)}
              ar={ar}
              onChangePhoto={onChangePhoto}
            />

            <div className="vp-identity-data">
              <PassportFieldBlock
                labelEn="Full Name"
                labelAr="الاسم الكامل"
                value={passport.fullName}
                large
              />
              <PassportFieldBlock
                labelEn="Date of Birth"
                labelAr="تاريخ الميلاد"
                value={formatPassportDob(passport.dateOfBirth)}
              />
              <PassportFieldBlock
                labelEn="Governorate"
                labelAr="المحافظة"
                value={govDisplay}
              />
            </div>
          </div>

          <PassportMembershipRow
            memberSince={passport.memberSinceYear}
            levelLabel={levelName}
            levelMark={passport.level.mark}
          />
        </div>
      </PassportDocumentShell>

      <PassportVerificationPanel
        ar={ar}
        publicUrl={passport.publicUrl}
        showQr={passport.config.showQrCode}
      />
    </div>
  );
}
