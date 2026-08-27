import Image from "next/image";
import { IconCrown, IconSpark, TierIcon } from "@/components/club/icons";
import type { ClubTier } from "@/lib/club/types";

type Props = {
  ar: boolean;
  fullName: string;
  memberId: string;
  memberIdLabel: string;
  points: number;
  tier: ClubTier;
};

export function ClubMembershipCard({
  ar,
  fullName,
  memberId,
  memberIdLabel,
  points,
  tier,
}: Props) {
  return (
    <article className="club-member-card" aria-label="VELORA membership card">
      <div className="club-member-card__sheen" aria-hidden />
      <div className="club-member-card__watermark" aria-hidden>
        V
      </div>
      <div className="club-member-card__top">
        <div>
          <div className="relative mb-2 h-6 w-[5.75rem] opacity-90">
            <Image
              src="/brand/velora-club-logo.png"
              alt=""
              fill
              className="object-contain object-start brightness-110"
              sizes="96px"
            />
          </div>
          <p className="club-member-card__kicker">VELORA BEAUTY CLUB</p>
          <p className="club-tier-badge">
            <IconCrown size={11} />
            {tier.nameEn.toUpperCase()}
          </p>
        </div>
        <IconSpark size={15} className="club-member-card__spark" />
      </div>
      <p className="club-member-card__name">{fullName}</p>
      <div className="club-member-card__points">
        <p className="club-member-card__points-num">
          {points.toLocaleString(ar ? "ar-IQ" : "en-US")}
        </p>
        <p className="club-member-card__points-label">V·POINTS</p>
      </div>
      <div className="club-member-card__foot">
        <span dir="ltr">
          {memberIdLabel}
          <br />
          <span>{memberId}</span>
        </span>
        <TierIcon id={tier.id} size={15} className="opacity-75" />
      </div>
    </article>
  );
}
