"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { PassportGuillochePattern } from "./PassportGuillochePattern";
import { PassportWorldMapWatermark } from "./PassportWorldMapWatermark";
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
      <div className="vp-document__foil" aria-hidden />
      <div className="vp-document__grain" aria-hidden />
      <div className="vp-document__guilloche vp-document__guilloche--main" aria-hidden />
      <div className="vp-document__guilloche vp-document__guilloche--fine" aria-hidden />
      <div className="vp-document__guilloche vp-document__guilloche--corner" aria-hidden />
      <PassportWorldMapWatermark />
      <div className="vp-document__microtext vp-document__microtext--band" aria-hidden>
        VELORA · DIGITAL BEAUTY PASSPORT · VERIFIED · VELORA · DIGITAL BEAUTY PASSPORT ·
      </div>
      <div className="vp-document__microtext vp-document__microtext--edge" aria-hidden>
        VELORA · VERIFIED MEMBER · OFFICIALLY ISSUED · VELORA ·
      </div>
      <div className="vp-document__watermark" aria-hidden>
        <span>V</span>
      </div>
      <div className="vp-document__security-lines" aria-hidden />
      <div className="vp-document__frame" />
      <div className="vp-document__frame vp-document__frame--inner" />

      {showHeader ? (
        <header className="vp-masthead">
          <div className="vp-masthead__top" dir="ltr">
            <div className="vp-masthead__id">
              <PassportEmblem size={48} className="vp-masthead__seal" />
              {passportNumber ? (
                <div className="vp-masthead__number">
                  <span className="vp-masthead__number-en">Passport No.</span>
                  <span className="vp-masthead__number-ar">رقم الجواز</span>
                  <strong className="vp-masthead__number-value">{passportNumber}</strong>
                </div>
              ) : null}
            </div>

            <div className="vp-masthead__ornament" aria-hidden>
              <span />
              <i />
              <span />
            </div>
          </div>

          <div className="vp-masthead__brand-block">
            <div className="vp-masthead__logo">
              <Image
                src="/brand/velora-logo-dark.png"
                alt="VELORA"
                width={220}
                height={84}
                priority
                className="vp-masthead__logo-img"
              />
            </div>
            <p className="vp-masthead__doc-type" dir="ltr">
              Digital Beauty Passport
            </p>
            <div className="vp-masthead__divider" aria-hidden>
              <span />
              <em>✦</em>
              <span />
            </div>
            <p className="vp-masthead__inscription-title">
              جواز صادر عن VELORA
            </p>
            <p className="vp-masthead__inscription">
              يُسمح لحامله بالتبضّع بمنتجات العناية الكاملة ومنتجات الـMakeUp بلا حدود
            </p>
          </div>
        </header>
      ) : null}

      {pageLabel ? (
        <div className="vp-document__page-tag" dir="ltr">
          <span>{pageLabel}</span>
          {pageLabelAr ? (
            <span className="vp-document__page-tag-ar">{pageLabelAr}</span>
          ) : null}
        </div>
      ) : null}

      <div className="vp-document__body">{children}</div>
    </article>
  );
}
