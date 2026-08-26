export type PassportPageId =
  | "identity"
  | "beauty"
  | "journey"
  | "collection"
  | "achievements"
  | "level"
  | "match"
  | "prive";

export const PASSPORT_PAGES: {
  id: PassportPageId;
  num: string;
  en: string;
  ar: string;
}[] = [
  { id: "identity", num: "01", en: "Identity", ar: "الهوية" },
  { id: "beauty", num: "02", en: "Beauty", ar: "الجمال" },
  { id: "journey", num: "03", en: "Journey", ar: "الرحلة" },
  { id: "collection", num: "04", en: "Collection", ar: "المجموعة" },
  { id: "achievements", num: "05", en: "Badges", ar: "الإنجازات" },
  { id: "level", num: "06", en: "Level", ar: "المستوى" },
  { id: "match", num: "07", en: "Match", ar: "التوافق" },
  { id: "prive", num: "08", en: "Privé", ar: "بريفيه" },
];

type Props = {
  ar?: boolean;
  active: PassportPageId;
  onChange: (id: PassportPageId) => void;
};

export function PassportPageIndex({ ar = false, active, onChange }: Props) {
  return (
    <nav className="vp-index" aria-label={ar ? "صفحات الجواز" : "Passport pages"}>
      {PASSPORT_PAGES.map((p) => (
        <button
          key={p.id}
          type="button"
          className="vp-index__btn"
          data-active={active === p.id}
          onClick={() => onChange(p.id)}
        >
          <span className="vp-index__num">{p.num}</span>
          {ar ? p.ar : p.en}
        </button>
      ))}
    </nav>
  );
}
