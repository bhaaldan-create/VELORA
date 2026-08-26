"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import "@/components/passport/passport.css";

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
      <div className="pp-root" dir={ar ? "rtl" : "ltr"}>
        <div className="pp-shell">
          <div className="pp-skel" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pp-root" dir={ar ? "rtl" : "ltr"}>
        <div className="pp-shell">
          <p className="pp-eyebrow">VELORA</p>
          <div className="pp-empty">{error || "—"}</div>
          <p style={{ textAlign: "center" }}>
            <Link href="/shop" className="pp-link">
              {ar ? "اكتشفي VELORA" : "Discover VELORA"}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const levelName = ar ? data.level.nameAr : data.level.nameEn;

  return (
    <div className="pp-root" dir={ar ? "rtl" : "ltr"}>
      <div className="pp-shell">
        <p className="pp-eyebrow">VELORA</p>
        <h1 className="pp-title">MY VELORA PASSPORT</h1>
        <p className="pp-subtitle">
          {ar ? "هوية رقمية عامة وآمنة" : "A public-safe digital beauty identity"}
        </p>

        <div className="pp-cover" style={{ marginTop: "1.5rem" }}>
          <div className="pp-cover-brand">VELORA MEMBER</div>
          <div className="pp-cover-hero">
            <h2>{data.displayName}</h2>
            <p>
              {levelName} {data.level.mark}
            </p>
          </div>
          <div className="pp-cover-meta">
            <span>{data.passportNumber}</span>
            <span>
              {ar ? "منذ" : "Since"} {data.memberSinceYear}
            </span>
          </div>
        </div>

        {data.achievements.length ? (
          <section className="pp-page">
            <p className="pp-page-label">
              {ar ? "الإنجازات" : "Achievements"}
            </p>
            <div className="pp-ach-list">
              {data.achievements.map((a) => (
                <div key={a.key} className="pp-ach">
                  <div className="pp-ach-mark">✦</div>
                  <strong style={{ fontSize: "0.9rem" }}>
                    {ar ? a.nameAr : a.nameEn}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="pp-share-row">
          <Link
            href="/shop"
            className="pp-share-btn primary"
            style={{ textAlign: "center", textDecoration: "none" }}
          >
            {ar ? "اكتشفي VELORA" : "Discover VELORA"}
          </Link>
        </div>
      </div>
    </div>
  );
}
