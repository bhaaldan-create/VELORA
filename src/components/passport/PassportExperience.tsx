"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import type { PassportPayload } from "@/lib/passport/ensure";
import {
  BEAUTY_GOAL_OPTIONS,
  CATEGORY_OPTIONS,
  FINISH_OPTIONS,
  MAKEUP_STYLE_OPTIONS,
  SKIN_CONCERN_OPTIONS,
  SKIN_TYPE_OPTIONS,
} from "@/lib/passport/types";
import { IRAQ_GOVERNORATES } from "@/lib/passport/governorates";
import "./passport.css";

type PageId =
  | "identity"
  | "beauty"
  | "journey"
  | "collection"
  | "achievements"
  | "level"
  | "match"
  | "prive"
  | "share";

const PAGES: { id: PageId; en: string; ar: string }[] = [
  { id: "identity", en: "Identity", ar: "الهوية" },
  { id: "beauty", en: "Beauty", ar: "الجمال" },
  { id: "journey", en: "Journey", ar: "الرحلة" },
  { id: "collection", en: "Collection", ar: "المجموعة" },
  { id: "achievements", en: "Badges", ar: "الإنجازات" },
  { id: "level", en: "Level", ar: "المستوى" },
  { id: "match", en: "Match", ar: "التوافق" },
  { id: "prive", en: "Privé", ar: "بريفيه" },
  { id: "share", en: "Share", ar: "مشاركة" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "V";
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "V";
}

function toggleIn(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function compressImage(file: File, maxEdge = 640, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

/** Rule-based match — no AI claims. Returns null when profile incomplete. */
function computeMatch(p: PassportPayload): {
  percent: number;
  reasons: { en: string; ar: string }[];
} | null {
  const bp = p.beautyProfile;
  const filled =
    Number(!!bp.skinType) +
    Number(bp.skinConcerns.length > 0) +
    Number(bp.beautyGoals.length > 0) +
    Number(!!bp.preferredFinish) +
    Number(bp.favoriteCategories.length > 0);
  if (filled < 2) return null;

  let score = 55 + filled * 7;
  if (p.journey.totalOrders > 0) score += 6;
  if (p.wishlistCount > 0) score += 4;
  if (p.achievements.some((a) => a.unlocked)) score += 4;
  score = Math.min(96, score);

  const reasons: { en: string; ar: string }[] = [];
  if (bp.skinType) {
    reasons.push({
      en: "Matches your skin profile",
      ar: "يتوافق مع ملف بشرتكِ",
    });
  }
  if (bp.preferredFinish) {
    reasons.push({
      en: "Matches your preferred finish",
      ar: "يتوافق مع اللمسة المفضلة لديكِ",
    });
  }
  if (bp.beautyGoals.length) {
    reasons.push({
      en: "Matches your beauty goals",
      ar: "يتوافق مع أهداف جمالكِ",
    });
  }
  if (bp.favoriteCategories.length || p.wishlistCount > 0) {
    reasons.push({
      en: "Matches your previous preferences",
      ar: "يتوافق مع تفضيلاتكِ السابقة",
    });
  }
  return { percent: score, reasons: reasons.slice(0, 4) };
}

export function PassportExperience() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passport, setPassport] = useState<PassportPayload | null>(null);
  const [opened, setOpened] = useState(false);
  const [page, setPage] = useState<PageId>("identity");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [dob, setDob] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [skinType, setSkinType] = useState("");
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [beautyGoals, setBeautyGoals] = useState<string[]>([]);
  const [makeupStyle, setMakeupStyle] = useState("");
  const [preferredFinish, setPreferredFinish] = useState("");
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/passport", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        passport?: PassportPayload;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.passport) {
        throw new Error(data.error || "Failed");
      }
      const p = data.passport;
      setPassport(p);
      setOpened(Boolean(p.passportOpenedAt));
      setDob(p.dateOfBirth || "");
      setGovernorate(p.governorate || "");
      setSkinType(p.beautyProfile.skinType || "");
      setSkinConcerns(p.beautyProfile.skinConcerns || []);
      setBeautyGoals(p.beautyProfile.beautyGoals || []);
      setMakeupStyle(p.beautyProfile.makeupStyle || "");
      setPreferredFinish(p.beautyProfile.preferredFinish || "");
      setFavoriteCategories(p.beautyProfile.favoriteCategories || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : ar
            ? "تعذّر تحميل الجواز."
            : "Could not load passport.",
      );
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      setSaving(true);
      setMessage(null);
      try {
        const res = await fetch("/api/auth/passport", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          passport?: PassportPayload;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.passport) {
          throw new Error(data.error || "Save failed");
        }
        setPassport(data.passport);
        setMessage(ar ? "تم الحفظ ✦" : "Saved ✦");
        return data.passport;
      } catch (err) {
        setMessage(
          err instanceof Error
            ? err.message
            : ar
              ? "تعذّر الحفظ."
              : "Could not save.",
        );
        return null;
      } finally {
        setSaving(false);
      }
    },
    [ar],
  );

  async function onOpen() {
    setOpened(true);
    await patch({ markOpened: true });
  }

  async function onSaveIdentity() {
    await patch({
      dateOfBirth: dob || null,
      governorate: governorate || null,
    });
  }

  async function onSaveBeauty() {
    await patch({
      beautyProfile: {
        skinType,
        skinConcerns,
        beautyGoals,
        makeupStyle,
        preferredFinish,
        favoriteCategories,
      },
    });
  }

  async function onAvatar(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      await patch({ avatarUrl: dataUrl });
    } catch {
      setMessage(ar ? "تعذّر رفع الصورة." : "Could not upload photo.");
    }
  }

  const match = useMemo(
    () => (passport ? computeMatch(passport) : null),
    [passport],
  );

  const timeline = useMemo(() => {
    if (!passport) return [];
    const items: { at: string; en: string; ar: string }[] = [];
    items.push({
      at: String(passport.memberSinceYear),
      en: "Joined VELORA",
      ar: "انضمامكِ إلى VELORA",
    });
    for (const a of passport.achievements.filter((x) => x.unlocked)) {
      const d = a.unlockedAt ? new Date(a.unlockedAt) : null;
      const label = d
        ? d.toLocaleDateString(ar ? "ar-IQ" : "en-GB", {
            month: "short",
            year: "numeric",
          })
        : "";
      items.push({
        at: label,
        en: a.nameEn,
        ar: a.nameAr,
      });
    }
    if (passport.journey.totalOrders > 0) {
      items.push({
        at: "",
        en: `${passport.journey.totalOrders} beauty order${passport.journey.totalOrders === 1 ? "" : "s"}`,
        ar: `${passport.journey.totalOrders} طلب جمال`,
      });
    }
    return items;
  }, [passport, ar]);

  if (loading) {
    return (
      <div className="pp-root" dir={ar ? "rtl" : "ltr"}>
        <div className="pp-shell">
          <p className="pp-eyebrow">MY VELORA</p>
          <h1 className="pp-title">
            {ar ? "جوازكِ الرقمي" : "Your Beauty Passport"}
          </h1>
          <div className="pp-skel" aria-hidden />
        </div>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="pp-root" dir={ar ? "rtl" : "ltr"}>
        <div className="pp-shell">
          <Link href="/account/my-velora" className="pp-back">
            ← {ar ? "عودة" : "Back"}
          </Link>
          <p className="pp-empty">{error || "—"}</p>
        </div>
      </div>
    );
  }

  const levelName = ar ? passport.level.nameAr : passport.level.nameEn;
  const govLabel = ar
    ? passport.governorateLabelAr
    : passport.governorateLabelEn;

  return (
    <div className="pp-root" dir={ar ? "rtl" : "ltr"}>
      <div className="pp-shell">
        <Link href="/account/my-velora" className="pp-back">
          ← MY VELORA
        </Link>
        <p className="pp-eyebrow">MY VELORA PASSPORT</p>
        <h1 className="pp-title">
          {ar ? "هويتكِ داخل عالم VELORA" : "Your identity inside VELORA"}
        </h1>
        <p className="pp-subtitle">
          {ar
            ? "جواز رقمي فاخر يجمع رحلتكِ، مستواكِ، وإنجازاتكِ."
            : "A luxury digital passport for your beauty journey."}
        </p>

        {!opened ? (
          <>
            <div className="pp-cover">
              <div className="pp-cover-brand">VELORA</div>
              <div className="pp-cover-hero">
                <h2>BEAUTY PASSPORT</h2>
                <p>Digital Beauty Identity</p>
              </div>
              <div className="pp-cover-meta">
                <span>{passport.passportNumber}</span>
                <span>
                  {levelName} {passport.level.mark}
                </span>
              </div>
            </div>
            <button type="button" className="pp-open-btn" onClick={() => void onOpen()}>
              {ar ? "فتح الجواز" : "Open Passport"}
            </button>
          </>
        ) : (
          <div className="pp-book">
            <div className="pp-tabs" role="tablist">
              {PAGES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  className="pp-tab"
                  data-active={page === t.id}
                  onClick={() => setPage(t.id)}
                >
                  {ar ? t.ar : t.en}
                </button>
              ))}
            </div>

            {page === "identity" ? (
              <section className="pp-page">
                <p className="pp-page-label">Page 01</p>
                <h3>{ar ? "هويتكِ في VELORA" : "Your VELORA Identity"}</h3>

                <div className="pp-avatar-wrap">
                  {passport.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={passport.avatarUrl}
                      alt=""
                      className="pp-avatar"
                    />
                  ) : (
                    <div className="pp-avatar pp-avatar-fallback">
                      {initials(passport.fullName)}
                    </div>
                  )}
                  <div className="pp-avatar-actions">
                    <button
                      type="button"
                      className="pp-ghost-btn"
                      onClick={() => fileRef.current?.click()}
                    >
                      {ar ? "تغيير الصورة" : "Change photo"}
                    </button>
                    {passport.avatarUrl ? (
                      <button
                        type="button"
                        className="pp-ghost-btn"
                        onClick={() => void patch({ avatarUrl: null })}
                      >
                        {ar ? "حذف" : "Remove"}
                      </button>
                    ) : null}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        void onAvatar(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                </div>

                <div className="pp-fields">
                  <label className="pp-field">
                    <span>{ar ? "الاسم" : "Name"}</span>
                    <strong>{passport.fullName}</strong>
                  </label>
                  <label className="pp-field">
                    <span>{ar ? "تاريخ الميلاد" : "Date of Birth"}</span>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </label>
                  <label className="pp-field">
                    <span>{ar ? "المحافظة" : "Governorate"}</span>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                    >
                      <option value="">
                        {ar ? "اختاري المحافظة" : "Select governorate"}
                      </option>
                      {IRAQ_GOVERNORATES.map((g) => (
                        <option key={g.id} value={g.id}>
                          {ar ? g.ar : g.en}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="pp-field">
                    <span>{ar ? "رقم الجواز" : "Passport No"}</span>
                    <strong>{passport.passportNumber}</strong>
                  </div>
                  <div className="pp-field">
                    <span>{ar ? "عضوة منذ" : "Member Since"}</span>
                    <strong>{passport.memberSinceYear}</strong>
                  </div>
                  <div className="pp-field">
                    <span>{ar ? "المستوى" : "Beauty Level"}</span>
                    <strong>
                      {levelName} {passport.level.mark}
                    </strong>
                  </div>
                </div>

                <div className="pp-status">
                  <span>✓</span>
                  {ar ? "عضوة VELORA نشطة" : "Active VELORA Member"}
                </div>

                <button
                  type="button"
                  className="pp-save"
                  disabled={saving}
                  onClick={() => void onSaveIdentity()}
                >
                  {saving
                    ? ar
                      ? "جارٍ الحفظ…"
                      : "Saving…"
                    : ar
                      ? "حفظ الهوية"
                      : "Save Identity"}
                </button>
                {message ? (
                  <p className="pp-subtitle" style={{ textAlign: "center" }}>
                    {message}
                  </p>
                ) : null}
              </section>
            ) : null}

            {page === "beauty" ? (
              <section className="pp-page">
                <p className="pp-page-label">Page 02</p>
                <h3>{ar ? "ملف جمالكِ" : "My Beauty Profile"}</h3>

                <div className="pp-fields" style={{ marginTop: "1.25rem" }}>
                  <label className="pp-field">
                    <span>{ar ? "نوع البشرة" : "Skin Type"}</span>
                    <select
                      value={skinType}
                      onChange={(e) => setSkinType(e.target.value)}
                    >
                      <option value="">
                        {ar ? "اختاري" : "Select"}
                      </option>
                      {SKIN_TYPE_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {ar ? o.ar : o.en}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="pp-field">
                    <span>{ar ? "اهتمامات البشرة" : "Skin Concerns"}</span>
                    <div className="pp-chip-row">
                      {SKIN_CONCERN_OPTIONS.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className="pp-chip"
                          data-on={skinConcerns.includes(o.id)}
                          onClick={() =>
                            setSkinConcerns(toggleIn(skinConcerns, o.id))
                          }
                        >
                          {ar ? o.ar : o.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pp-field">
                    <span>{ar ? "أهداف الجمال" : "Beauty Goals"}</span>
                    <div className="pp-chip-row">
                      {BEAUTY_GOAL_OPTIONS.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className="pp-chip"
                          data-on={beautyGoals.includes(o.id)}
                          onClick={() =>
                            setBeautyGoals(toggleIn(beautyGoals, o.id))
                          }
                        >
                          {ar ? o.ar : o.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="pp-field">
                    <span>{ar ? "أسلوب المكياج" : "Makeup Style"}</span>
                    <select
                      value={makeupStyle}
                      onChange={(e) => setMakeupStyle(e.target.value)}
                    >
                      <option value="">{ar ? "اختاري" : "Select"}</option>
                      {MAKEUP_STYLE_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {ar ? o.ar : o.en}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="pp-field">
                    <span>{ar ? "اللمسة المفضلة" : "Preferred Finish"}</span>
                    <select
                      value={preferredFinish}
                      onChange={(e) => setPreferredFinish(e.target.value)}
                    >
                      <option value="">{ar ? "اختاري" : "Select"}</option>
                      {FINISH_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {ar ? o.ar : o.en}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="pp-field">
                    <span>{ar ? "الفئات المفضلة" : "Favorite Categories"}</span>
                    <div className="pp-chip-row">
                      {CATEGORY_OPTIONS.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className="pp-chip"
                          data-on={favoriteCategories.includes(o.id)}
                          onClick={() =>
                            setFavoriteCategories(
                              toggleIn(favoriteCategories, o.id),
                            )
                          }
                        >
                          {ar ? o.ar : o.en}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="pp-save"
                  disabled={saving}
                  onClick={() => void onSaveBeauty()}
                >
                  {saving
                    ? ar
                      ? "جارٍ الحفظ…"
                      : "Saving…"
                    : ar
                      ? "حفظ ملف الجمال"
                      : "Save Beauty Profile"}
                </button>
              </section>
            ) : null}

            {page === "journey" ? (
              <section className="pp-page">
                <p className="pp-page-label">Page 03</p>
                <h3>{ar ? "رحلة جمالكِ" : "My Beauty Journey"}</h3>
                {timeline.length <= 1 && passport.journey.totalOrders === 0 ? (
                  <div className="pp-empty">
                    <p>
                      {ar
                        ? "رحلتكِ الجمالية بدأت للتو."
                        : "Your beauty journey is just beginning."}
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                      <Link href="/shop" className="pp-link">
                        {ar ? "استكشفي VELORA" : "Explore VELORA"}
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="pp-timeline">
                    {timeline.map((item, i) => (
                      <div key={`${item.en}-${i}`} className="pp-tl-item">
                        {item.at ? <time>{item.at}</time> : null}
                        <p>{ar ? item.ar : item.en}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pp-grid-2">
                  <div className="pp-stat">
                    <b>{passport.journey.totalOrders}</b>
                    <span>{ar ? "طلبات" : "Orders"}</span>
                  </div>
                  <div className="pp-stat">
                    <b>{passport.journey.brandsTried}</b>
                    <span>{ar ? "علامات" : "Brands"}</span>
                  </div>
                </div>
              </section>
            ) : null}

            {page === "collection" ? (
              <section className="pp-page">
                <p className="pp-page-label">Page 04</p>
                <h3>{ar ? "مجموعتكِ" : "My Collection"}</h3>
                <div className="pp-grid-2">
                  <Link href="/account?section=wishlist" className="pp-stat">
                    <b>{passport.wishlistCount}</b>
                    <span>{ar ? "المفضلة" : "Favorites"}</span>
                  </Link>
                  <Link href="/account?section=orders" className="pp-stat">
                    <b>{passport.journey.totalOrders}</b>
                    <span>{ar ? "مشتريات" : "Purchased"}</span>
                  </Link>
                </div>
                {passport.wishlistCount === 0 &&
                passport.journey.totalOrders === 0 ? (
                  <div className="pp-empty">
                    <p>
                      {ar
                        ? "ابدئي ببناء مجموعتكِ الجمالية."
                        : "Start building your beauty collection."}
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                      <Link href="/shop" className="pp-link">
                        {ar ? "تسوقي الآن" : "Shop now"}
                      </Link>
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {page === "achievements" ? (
              <section className="pp-page">
                <p className="pp-page-label">Page 05</p>
                <h3>{ar ? "إنجازات VELORA" : "VELORA Achievements"}</h3>
                <div className="pp-ach-list">
                  {passport.achievements.map((a) => (
                    <div
                      key={a.key}
                      className="pp-ach"
                      data-locked={!a.unlocked}
                    >
                      <div className="pp-ach-mark">
                        {a.unlocked ? "✦" : "○"}
                      </div>
                      <div>
                        <strong style={{ fontSize: "0.92rem" }}>
                          {ar ? a.nameAr : a.nameEn}
                        </strong>
                        <p
                          style={{
                            marginTop: 2,
                            fontSize: "0.72rem",
                            color: "var(--pp-muted)",
                          }}
                        >
                          {a.unlocked
                            ? a.unlockedAt
                              ? new Date(a.unlockedAt).toLocaleDateString(
                                  ar ? "ar-IQ" : "en-GB",
                                )
                              : ar
                                ? "مفتوح"
                                : "Unlocked"
                            : ar
                              ? "مقفل"
                              : "Locked"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {page === "level" ? (
              <section className="pp-page">
                <p className="pp-page-label">Page 06</p>
                <h3>{ar ? "مستوى الجمال" : "Beauty Level"}</h3>
                <div className="pp-level-pill">
                  <div className="pp-level-name">
                    {levelName} {passport.level.mark}
                  </div>
                  <div className="pp-xp">
                    {passport.xp.toLocaleString()} XP
                    {passport.nextLevel
                      ? ` · ${passport.pointsToNext.toLocaleString()} ${ar ? "إلى" : "to"} ${ar ? passport.nextLevel.nameAr : passport.nextLevel.nameEn}`
                      : ar
                        ? " · أعلى مستوى"
                        : " · Top level"}
                  </div>
                  <div className="pp-progress" aria-hidden>
                    <i style={{ width: `${Math.round(passport.progressRatio * 100)}%` }} />
                  </div>
                </div>
                <p className="pp-subtitle" style={{ marginTop: "1rem" }}>
                  {ar
                    ? "XP هنا هو نفس نقاط VELORA Beauty Club — بدون نظام منفصل."
                    : "XP here is your VELORA Beauty Club points — same system, Passport display."}
                </p>
                <p style={{ marginTop: "0.75rem" }}>
                  <Link href="/account/club" className="pp-link">
                    {ar ? "فتح Beauty Club" : "Open Beauty Club"}
                  </Link>
                </p>
              </section>
            ) : null}

            {page === "match" ? (
              <section className="pp-page">
                <p className="pp-page-label">Page 07</p>
                <h3>{ar ? "توافقكِ مع VELORA" : "Your VELORA Match"}</h3>
                {!match ? (
                  <div className="pp-empty">
                    <p>
                      {ar
                        ? "أكملي ملف الجمال لرؤية نسبة التوافق."
                        : "Complete your beauty profile to see your match."}
                    </p>
                    <button
                      type="button"
                      className="pp-save"
                      onClick={() => setPage("beauty")}
                    >
                      {ar ? "ملف الجمال" : "Beauty Profile"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="pp-level-pill">
                      <div className="pp-level-name">{match.percent}%</div>
                      <div className="pp-xp">
                        {ar ? "توافق جمالي" : "Beauty Match"}
                      </div>
                    </div>
                    <div className="pp-ach-list">
                      {match.reasons.map((r) => (
                        <div key={r.en} className="pp-ach">
                          <div className="pp-ach-mark">✓</div>
                          <strong style={{ fontSize: "0.9rem" }}>
                            {ar ? r.ar : r.en}
                          </strong>
                        </div>
                      ))}
                    </div>
                    <p className="pp-subtitle" style={{ marginTop: "1rem" }}>
                      {ar
                        ? "محرك قواعد بسيط — جاهز لربطه لاحقًا بمستشار ذكاء اصطناعي."
                        : "Rule-based for now — architecture ready for AI later."}
                    </p>
                  </>
                )}
              </section>
            ) : null}

            {page === "prive" ? (
              <section className="pp-page">
                <p className="pp-page-label">Page 08</p>
                <h3>VELORA PRIVÉ</h3>
                {passport.level.id === "prive" ? (
                  <div className="pp-ach-list">
                    {[
                      {
                        en: "Priority Access",
                        ar: "أولوية الوصول",
                      },
                      {
                        en: "Exclusive Drops",
                        ar: "إصدارات حصرية",
                      },
                      {
                        en: "Private Offers",
                        ar: "عروض خاصة",
                      },
                      {
                        en: "Birthday Rewards",
                        ar: "مكافآت عيد الميلاد",
                      },
                    ].map((b) => (
                      <div key={b.en} className="pp-ach">
                        <div className="pp-ach-mark">✦</div>
                        <strong style={{ fontSize: "0.9rem" }}>
                          {ar ? b.ar : b.en}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pp-empty">
                    <p>
                      {ar
                        ? `مستواكِ الحالي ${levelName}. واصلي جمع النقاط للوصول إلى PRIVÉ.`
                        : `You're at ${levelName}. Keep earning points toward PRIVÉ.`}
                    </p>
                    <p style={{ marginTop: "0.75rem" }}>
                      <Link href="/account/club" className="pp-link">
                        {ar ? "مزايا النادي" : "Club benefits"}
                      </Link>
                    </p>
                  </div>
                )}
                {passport.isBirthdayToday ? (
                  <div className="pp-level-pill" style={{ marginTop: "1.25rem" }}>
                    <div className="pp-level-name">
                      {ar
                        ? `عيد ميلاد سعيد، ${passport.fullName.split(" ")[0]} ✦`
                        : `Happy Birthday, ${passport.fullName.split(" ")[0]} ✦`}
                    </div>
                    <div className="pp-xp">
                      {ar
                        ? "هدية VELORA بانتظاركِ."
                        : "Your VELORA gift is waiting."}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {page === "share" ? (
              <section className="pp-page">
                <p className="pp-page-label">Share</p>
                <h3>{ar ? "شاركي جوازكِ" : "Share My Passport"}</h3>
                <p className="pp-subtitle">
                  {ar
                    ? "صفحة عامة آمنة — بدون بريد أو هاتف أو طلبات."
                    : "Public-safe page — no email, phone, or orders."}
                </p>
                {passport.config.showQrCode ? (
                  <div className="pp-qr">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/my-velora/qr?data=${encodeURIComponent(passport.publicUrl)}`}
                      alt="Passport QR"
                    />
                  </div>
                ) : null}
                <p
                  className="pp-subtitle"
                  style={{ textAlign: "center", marginTop: "0.75rem" }}
                >
                  {passport.passportNumber}
                  {govLabel ? ` · ${govLabel}` : ""}
                </p>
                <div className="pp-share-row">
                  <a
                    className="pp-share-btn primary"
                    href={passport.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textAlign: "center", textDecoration: "none" }}
                  >
                    {ar ? "فتح الصفحة العامة" : "Open Public Passport"}
                  </a>
                  <button
                    type="button"
                    className="pp-share-btn"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(passport.publicUrl);
                        setMessage(ar ? "تم نسخ الرابط" : "Link copied");
                      } catch {
                        setMessage(passport.publicUrl);
                      }
                    }}
                  >
                    {ar ? "نسخ الرابط" : "Copy Link"}
                  </button>
                </div>
                {message ? (
                  <p className="pp-subtitle" style={{ textAlign: "center" }}>
                    {message}
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
