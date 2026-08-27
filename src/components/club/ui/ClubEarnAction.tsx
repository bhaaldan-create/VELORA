import { ClubIcon } from "@/components/club/icons";

type Props = {
  icon: string;
  title: string;
  body: string;
  hint?: string | null;
};

export function ClubEarnAction({ icon, title, body, hint }: Props) {
  return (
    <article className="club-earn-action">
      <div className="club-earn-action__icon">
        <ClubIcon name={icon} size={17} />
      </div>
      <div className="club-earn-action__body">
        <div className="club-earn-action__row">
          <h3 className="club-earn-action__title">{title}</h3>
          {hint ? <span className="club-earn-action__hint">{hint}</span> : null}
        </div>
        <p className="club-earn-action__desc">{body}</p>
      </div>
    </article>
  );
}
