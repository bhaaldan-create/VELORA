"use client";

import type { PassportPayload } from "@/lib/passport/ensure";
import { PassportDocumentShell } from "../shell/PassportDocumentShell";
import { PassportFieldBlock } from "./PassportFieldBlock";
import { PassportPortraitFrame } from "./PassportPortraitFrame";
import { PassportSignature } from "./PassportSignature";
import { PassportSecurityChip } from "./PassportSecurityChip";
import { PassportVerificationPanel } from "./PassportVerificationPanel";
import { PassportActionBar } from "../actions/PassportActionBar";
import { formatPassportDob, passportInitials } from "../utils";

type Props = {
  ar?: boolean;
  passport: PassportPayload;
  onEdit: () => void;
  onChangePhoto: () => void;
  onShare: () => void;
  onSave: () => void;
  onPrint: () => void;
  savingStory?: boolean;
};

export function PassportIdentityPage({
  ar = false,
  passport,
  onEdit,
  onChangePhoto,
  onShare,
  onSave,
  onPrint,
  savingStory = false,
}: Props) {
  const levelName = ar ? passport.level.nameAr : passport.level.nameEn;
  const govEn = passport.governorateLabelEn || "—";
  const govAr = passport.governorateLabelAr || "";
  const govDisplay = govAr && !ar ? `${govEn} · ${govAr}` : ar ? govAr || "—" : govEn;

  return (
    <>
      <PassportDocumentShell
        pageLabel="01 — Identity"
        pageLabelAr="الهوية"
        passportNumber={passport.passportNumber}
      >
        <div className="vp-identity-grid">
          <PassportPortraitFrame
            avatarUrl={passport.avatarUrl}
            initials={passportInitials(passport.fullName)}
            ar={ar}
            onChangePhoto={onChangePhoto}
          />
          <div>
            <PassportFieldBlock
              labelEn="Full Name"
              labelAr="الاسم الكامل"
              value={passport.fullName}
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

        <div style={{ marginTop: "0.5rem" }}>
          <PassportFieldBlock
            labelEn="Member Since"
            labelAr="عضوة منذ"
            value={String(passport.memberSinceYear)}
          />
          <PassportFieldBlock
            labelEn="Member Level"
            labelAr="مستوى العضوية"
            value={`${levelName} ${passport.level.mark}`}
            highlight
          />
        </div>

        <div className="vp-identity-footer">
          <PassportSignature ar={ar} />
          <PassportSecurityChip />
        </div>

        <PassportVerificationPanel
          ar={ar}
          publicUrl={passport.publicUrl}
          showQr={passport.config.showQrCode}
        />

        <PassportActionBar
          ar={ar}
          onEdit={onEdit}
          onShare={onShare}
          onSave={onSave}
          onPrint={onPrint}
          saveDisabled={savingStory}
        />
        {savingStory ? (
          <p className="vp-toast">{ar ? "جارٍ تجهيز الستوري…" : "Preparing Story…"}</p>
        ) : null}
      </PassportDocumentShell>
    </>
  );
}
