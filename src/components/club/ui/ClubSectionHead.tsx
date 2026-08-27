type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
};

export function ClubSectionHead({
  kicker,
  title,
  subtitle,
  align = "start",
}: Props) {
  return (
    <header className={`club-section-head club-section-head--${align}`}>
      {kicker ? <p className="club-section-head__kicker">{kicker}</p> : null}
      <h2 className="club-section-head__title">{title}</h2>
      {subtitle ? <p className="club-section-head__sub">{subtitle}</p> : null}
    </header>
  );
}
