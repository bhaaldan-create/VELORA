import { IconCrown, TierIcon } from "@/components/club/icons";
import type { ClubTier } from "@/lib/club/types";

type Props = {
  tiers: ClubTier[];
  currentTierId: string;
  currentTierIndex: number;
  points: number;
  nextTier: ClubTier | null;
  pointsToNext: number;
  progressRatio: number;
  yourLevelLabel: string;
  progressCaption: string;
  remainingLabel: string;
  hideStatus?: boolean;
  emphasisTierId?: string;
};

export function ClubTierHierarchy({
  tiers,
  currentTierId,
  currentTierIndex,
  points,
  nextTier,
  pointsToNext,
  progressRatio,
  yourLevelLabel,
  progressCaption,
  remainingLabel,
  hideStatus = false,
  emphasisTierId,
}: Props) {
  const emphasis = tiers.find((t) => t.id === (emphasisTierId ?? currentTierId));

  return (
    <div className="club-tier-hierarchy">
      {hideStatus ? null : (
        <div className="club-tier-hierarchy__status">
          <p className="club-tier-hierarchy__label">{yourLevelLabel}</p>
          <p className="club-tier-hierarchy__current">
            {emphasis?.nameEn.toUpperCase() ?? "MUSE"}
          </p>
          <p className="club-tier-hierarchy__caption">{progressCaption}</p>
        </div>
      )}

      <div className="club-tier-ladder" role="list">
        {tiers.map((tier, i) => {
          const isCurrent = tier.id === currentTierId;
          const isDone = i < currentTierIndex;
          return (
            <div
              key={tier.id}
              role="listitem"
              className={`club-tier-step ${isCurrent ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
            >
              <span className="club-tier-step__mark" aria-hidden>
                {isCurrent ? (
                  <IconCrown size={12} />
                ) : (
                  <TierIcon id={tier.id} size={12} />
                )}
              </span>
              <span className="club-tier-step__name">{tier.nameEn}</span>
            </div>
          );
        })}
      </div>

      <div className="club-tier-track" aria-hidden>
        <i style={{ width: `${Math.round((nextTier ? progressRatio : 1) * 100)}%` }} />
      </div>

      <div className="club-tier-hierarchy__foot">
        <span dir="ltr" className="tabular-nums">
          {points.toLocaleString("en-US")}
          {nextTier ? ` / ${nextTier.minPoints.toLocaleString("en-US")}` : ""}{" "}
          V·POINTS
        </span>
        <span>
          {nextTier
            ? `${pointsToNext.toLocaleString("en-US")} ${remainingLabel}`
            : "—"}
        </span>
      </div>
    </div>
  );
}
