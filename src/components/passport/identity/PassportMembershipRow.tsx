import { PassportSecurityChip } from "./PassportSecurityChip";

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
            <p className="vp-membership-cell__value vp-membership-cell__value--brand">
              VELORA
            </p>
            <svg
              viewBox="0 0 72 20"
              className="vp-membership-cell__sig"
              aria-hidden
            >
              <path
                d="M4 14 C14 8, 22 16, 36 10 S58 6, 68 12"
                fill="none"
                stroke="var(--vp-lavender-700)"
                strokeWidth="0.9"
                opacity="0.55"
              />
              <text
                x="36"
                y="11"
                textAnchor="middle"
                fontFamily="Georgia, serif"
                fontSize="9"
                fontStyle="italic"
                fill="var(--vp-lavender-700)"
                opacity="0.6"
              >
                Velora
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
