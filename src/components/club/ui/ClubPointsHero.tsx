import { ClubLogo } from "@/components/club/ClubLogo";

type Props = {
  ar: boolean;
  points: number;
  meta: string;
  ctaLabel: string;
};

export function ClubPointsHero({ ar, points, meta, ctaLabel }: Props) {
  return (
    <section className="club-points-hero" aria-label="V·POINTS">
      <div className="club-points-hero__atmosphere" aria-hidden />
      <div className="club-points-hero__monogram" aria-hidden>
        V
      </div>
      <div className="club-points-hero__inner">
        <ClubLogo height={44} className="club-points-hero__logo" />
        <p className="club-points-hero__kicker">VELORA POINTS</p>
        <h2 className="club-points-hero__title">
          {ar ? "برنامج نقاط VELORA" : "VELORA Points Program"}
        </h2>
        <p className="club-points-hero__sub">
          {ar
            ? "تجميعكِ لنقاطكِ واستبدالها بمكافآت حصرية"
            : "Collect your points and redeem exclusive beauty rewards."}
        </p>
        <div className="club-points-display">
          <span className="club-points-display__num">
            {points.toLocaleString(ar ? "ar-IQ" : "en-US")}
          </span>
          <span className="club-points-display__unit">V·POINTS</span>
        </div>
        <p className="club-points-hero__meta">{meta}</p>
        <a href="#club-activity" className="club-points-hero__cta">
          {ctaLabel}
          <span aria-hidden>{ar ? "←" : "→"}</span>
        </a>
      </div>
    </section>
  );
}
