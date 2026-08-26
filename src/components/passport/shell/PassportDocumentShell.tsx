"use client";

import type { ReactNode } from "react";
import { PassportGuillochePattern } from "./PassportGuillochePattern";
import { PassportEmblem } from "../identity/PassportEmblem";
import "../passport-tokens.css";
import "../passport-document.css";

type Props = {
  children: ReactNode;
  pageLabel?: string;
  pageLabelAr?: string;
  passportNumber?: string;
  showHeader?: boolean;
  className?: string;
};

export function PassportDocumentShell({
  children,
  pageLabel,
  pageLabelAr,
  passportNumber,
  showHeader = true,
  className = "",
}: Props) {
  return (
    <article className={`vp-document ${className}`.trim()}>
      <PassportGuillochePattern />
      <div className="vp-document__grain" aria-hidden />
      <div className="vp-document__guilloche" aria-hidden />
      <div className="vp-document__guilloche vp-document__guilloche--corner" aria-hidden />
      <div className="vp-document__watermark" aria-hidden>
        <span>V</span>
      </div>
      <div className="vp-document__microtext" aria-hidden>
        VELORA · VERIFIED · DIGITAL BEAUTY PASSPORT · VELORA · VERIFIED ·
      </div>
      <div className="vp-document__frame" />

      {showHeader ? (
        <header className="vp-document__header">
          <PassportEmblem size={52} />
          <div className="vp-document__header-center">
            <h1 className="vp-document__brand">VELORA</h1>
            <p className="vp-document__doc-type">Digital Beauty Passport</p>
            <p className="vp-document__doc-type-ar">جواز VELORA الرقمي للجمال</p>
          </div>
          {passportNumber ? (
            <div className="vp-document__passport-no">
              <span className="vp-field__label">Passport No.</span>
              <span className="vp-field__label-ar">رقم الجواز</span>
              <strong>{passportNumber}</strong>
            </div>
          ) : (
            <div className="vp-document__passport-no vp-document__passport-no--empty" />
          )}
        </header>
      ) : null}

      {pageLabel ? (
        <div className="vp-document__page-tag">
          <span>{pageLabel}</span>
          {pageLabelAr ? <span className="vp-document__page-tag-ar">{pageLabelAr}</span> : null}
        </div>
      ) : null}

      <div className="vp-document__body">{children}</div>
    </article>
  );
}
