"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { PassportDocumentShell } from "./shell/PassportDocumentShell";
import { PassportFieldBlock } from "./identity/PassportFieldBlock";
import { PassportEmblem } from "./identity/PassportEmblem";
import "./passport-document.css";

type PublicPassport = {
  displayName: string;
  passportNumber: string;
  memberSinceYear: number;
  level: { nameEn: string; nameAr: string; mark: string };
  achievements: Array<{ key: string; nameEn: string; nameAr: string }>;
};

export function PublicPassportView({ token }: { token: string }) {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const [data, setData] = useState<PublicPassport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/passport/${encodeURIComponent(token)}`);
        const json = (await res.json()) as {
          ok?: boolean;
          passport?: PublicPassport;
          error?: string;
        };
        if (!res.ok || !json.ok || !json.passport) {
          throw new Error(json.error || "Not found");
        }
        setData(json.passport);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : ar
              ? "الجواز غير متاح."
              : "Passport unavailable.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token, ar]);

  if (loading) {
    return (
      <div className="vp-root" dir={ar ? "rtl" : "ltr"}>
        <div className="vp-shell">
          <div className="vp-skel" aria-hidden />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="vp-root" dir={ar ? "rtl" : "ltr"}>
        <div className="vp-shell">
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <PassportEmblem size={48} />
          </div>
          <div className="vp-empty">{error || "—"}</div>
          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/shop" className="vp-link">
              {ar ? "اكتشفي VELORA" : "Discover VELORA"}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const levelName = ar ? data.level.nameAr : data.level.nameEn;

  return (
    <div className="vp-root" dir={ar ? "rtl" : "ltr"}>
      <div className="vp-shell">
        <PassportDocumentShell
          pageLabel="Verified Member"
          pageLabelAr="عضوية موثّقة"
          passportNumber={data.passportNumber}
        >
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <PassportEmblem size={56} />
            <p
              style={{
                margin: "0.65rem 0 0",
                fontFamily: "var(--vp-font-sans)",
                fontSize: "0.58rem",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "var(--vp-lavender-500)",
              }}
            >
              {ar ? "هوية رقمية عامة وآمنة" : "Public-safe digital identity"}
            </p>
          </div>

          <PassportFieldBlock
            labelEn="Member Name"
            labelAr="اسم العضوة"
            value={data.displayName}
            highlight
          />
          <PassportFieldBlock
            labelEn="Member Level"
            labelAr="مستوى العضوية"
            value={`${levelName} ${data.level.mark}`}
          />
          <PassportFieldBlock
            labelEn="Member Since"
            labelAr="عضوة منذ"
            value={String(data.memberSinceYear)}
          />

          {data.achievements.length ? (
            <div style={{ marginTop: "1rem" }}>
              <p className="vp-field__label">
                {ar ? "الإنجازات" : "Achievements"}
              </p>
              <p className="vp-field__label-ar">Achievements</p>
              {data.achievements.map((a) => (
                <div key={a.key} className="vp-ach-item">
                  <span className="vp-ach-mark">✦</span>
                  <span>{ar ? a.nameAr : a.nameEn}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
            <Link
              href="/shop"
              className="vp-save-inline"
              style={{ display: "inline-block", textDecoration: "none", width: "auto", paddingInline: "2rem" }}
            >
              {ar ? "اكتشفي VELORA" : "Discover VELORA"}
            </Link>
          </div>
        </PassportDocumentShell>
      </div>
    </div>
  );
}
