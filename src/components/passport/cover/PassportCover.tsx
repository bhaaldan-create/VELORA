"use client";

import { PassportEmblem } from "../identity/PassportEmblem";

type Props = {
  ar?: boolean;
  passportNumber: string;
  levelName: string;
  opening?: boolean;
  onOpen: () => void;
};

export function PassportCover({
  ar = false,
  passportNumber,
  levelName,
  opening = false,
  onOpen,
}: Props) {
  return (
    <div className="vp-cover-scene">
      <div className={`vp-cover ${opening ? "vp-cover--opening" : ""}`.trim()}>
        <div className="vp-cover__pattern" aria-hidden />
        <div className="vp-cover__frame" aria-hidden />
        <div className="vp-cover__top">
          <span className="vp-cover__brand-small">VELORA</span>
          <PassportEmblem size={44} />
        </div>
        <div className="vp-cover__hero">
          <h2>MY VELORA</h2>
          <p>{ar ? "جواز الجمال" : "Beauty Passport"}</p>
          <p className="vp-cover__sub-ar">
            {ar ? "هوية VELORA الرقمية" : "Digital Beauty Identity"}
          </p>
        </div>
        <div className="vp-cover__meta">
          <span>{passportNumber}</span>
          <span className="vp-cover__level">
            {levelName} ✦
          </span>
        </div>
      </div>
      {!opening ? (
        <button type="button" className="vp-open-btn" onClick={onOpen}>
          {ar ? "فتح الجواز" : "Open Passport"}
        </button>
      ) : null}
    </div>
  );
}
