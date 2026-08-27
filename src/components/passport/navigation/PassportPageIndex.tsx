"use client";

import { useEffect, useMemo, useState } from "react";

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

const GROUP_SIZE = 3;

function PageIcon({ id }: { id: PassportPageId }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.15,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "vp-index__icon",
    "aria-hidden": true as const,
  };

  switch (id) {
    case "identity":
      return (
        <svg {...common}>
          <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
          <circle cx="12" cy="9" r="2.2" />
          <path d="M8 16.5c1.2-1.6 2.6-2.4 4-2.4s2.8.8 4 2.4" />
        </svg>
      );
    case "beauty":
      return (
        <svg {...common}>
          <path d="M12 3.5l1.2 3.8L17 8.5l-3.8 1.2L12 13.5l-1.2-3.8L7 8.5l3.8-1.2L12 3.5Z" />
          <path d="M18.5 14.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9Z" />
        </svg>
      );
    case "journey":
      return (
        <svg {...common}>
          <path d="M5 18c2.5-1 4-3.2 4-5.5S7.5 7 5 6" />
          <path d="M19 6c-2.5 1-4 3.2-4 5.5S16.5 17 19 18" />
          <circle cx="12" cy="12" r="1.4" />
        </svg>
      );
    case "collection":
      return (
        <svg {...common}>
          <path d="M6 8.5h12l-1 10.5H7L6 8.5Z" />
          <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
        </svg>
      );
    case "achievements":
      return (
        <svg {...common}>
          <path d="M12 3.5l1.6 3.3 3.6.5-2.6 2.6.6 3.6L12 11.8 8.8 13.5l.6-3.6L6.8 7.3l3.6-.5L12 3.5Z" />
          <path d="M9.5 16.5h5M12 13.8v5.7" />
        </svg>
      );
    case "level":
      return (
        <svg {...common}>
          <path d="M5 9l2.5 1.2L12 5.5l4.5 4.7L19 9l-1 9.5H6L5 9Z" />
        </svg>
      );
    case "match":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2" />
        </svg>
      );
    case "prive":
      return (
        <svg {...common}>
          <path d="M12 4.5l2.2 4.4 4.8.7-3.5 3.4.8 4.8L12 15.5l-4.3 2.3.8-4.8L5 9.6l4.8-.7L12 4.5Z" />
        </svg>
      );
    default:
      return null;
  }
}

type Props = {
  ar?: boolean;
  active: PassportPageId;
  onChange: (id: PassportPageId) => void;
};

export function PassportPageIndex({ ar = false, active, onChange }: Props) {
  const groupCount = Math.ceil(PASSPORT_PAGES.length / GROUP_SIZE);

  const activeGroup = useMemo(() => {
    const idx = PASSPORT_PAGES.findIndex((p) => p.id === active);
    return Math.max(0, Math.floor(Math.max(0, idx) / GROUP_SIZE));
  }, [active]);

  const [group, setGroup] = useState(activeGroup);

  useEffect(() => {
    setGroup(activeGroup);
  }, [activeGroup]);

  const pages = useMemo(() => {
    const start = group * GROUP_SIZE;
    return PASSPORT_PAGES.slice(start, start + GROUP_SIZE);
  }, [group]);

  function goPrev() {
    setGroup((g) => Math.max(0, g - 1));
  }

  function goNext() {
    setGroup((g) => Math.min(groupCount - 1, g + 1));
  }

  return (
    <nav className="vp-index" aria-label={ar ? "صفحات الجواز" : "Passport pages"}>
      <div className="vp-index__shell">
        <div className="vp-index__items" role="tablist">
          {pages.map((p) => {
            const isActive = active === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className="vp-index__item"
                data-active={isActive}
                onClick={() => onChange(p.id)}
              >
                <PageIcon id={p.id} />
                <span className="vp-index__num" dir="ltr">
                  {isActive ? "✦ " : ""}
                  {p.num}
                </span>
                <span className="vp-index__en" dir="ltr">
                  {p.en}
                </span>
                <span className="vp-index__ar">{p.ar}</span>
              </button>
            );
          })}
        </div>

        <div className="vp-index__footer">
          <button
            type="button"
            className="vp-index__arrow"
            onClick={goPrev}
            disabled={group === 0}
            aria-label={ar ? "المجموعة السابقة" : "Previous pages"}
          >
            ‹
          </button>

          <div className="vp-index__dots" role="presentation">
            {Array.from({ length: groupCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                className="vp-index__dot"
                data-active={group === i}
                aria-label={ar ? `مجموعة ${i + 1}` : `Page group ${i + 1}`}
                onClick={() => setGroup(i)}
              />
            ))}
          </div>

          <button
            type="button"
            className="vp-index__arrow"
            onClick={goNext}
            disabled={group === groupCount - 1}
            aria-label={ar ? "المجموعة التالية" : "Next pages"}
          >
            ›
          </button>
        </div>
      </div>
    </nav>
  );
}
