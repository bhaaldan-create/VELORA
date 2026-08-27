import { PassportSecurityChip } from "./PassportSecurityChip";
import { PassportVeloraSignatureMark } from "./PassportVeloraSignatureMark";

type Props = {
  memberSince: number;
  levelLabel: string;
  levelMark: string;
};

export function PassportMembershipRow({
  memberSince,
  levelLabel,
  levelMark,
}: Props) {
  return (
    <div className="vp-membership-row">
      <PassportSecurityChip className="vp-membership-row__chip" />
      <div className="vp-membership-row__grid">
        <div className="vp-membership-cell">
          <p className="vp-membership-cell__label-en">Member Since</p>
          <p className="vp-membership-cell__label-ar">عضوة منذ</p>
          <p className="vp-membership-cell__value">{memberSince}</p>
        </div>

        <div className="vp-membership-cell">
          <p className="vp-membership-cell__label-en">Member Level</p>
          <p className="vp-membership-cell__label-ar">مستوى العضوية</p>
          <p className="vp-membership-cell__value vp-membership-cell__value--level">
            <span aria-hidden>{levelMark}</span>
            {levelLabel}
          </p>
        </div>

        <div className="vp-membership-cell vp-membership-cell--issued">
          <p className="vp-membership-cell__label-en">Issued By</p>
          <p className="vp-membership-cell__label-ar">صادر رسميًا عن</p>
          <div className="vp-membership-cell__issued">
            <PassportVeloraSignatureMark className="vp-membership-cell__sig" />
          </div>
        </div>
      </div>
    </div>
  );
}
