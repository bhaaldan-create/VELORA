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
import { PassportCover } from "./cover/PassportCover";
import { PassportIdentityPage } from "./identity/PassportIdentityPage";
import { PassportPageIndex, type PassportPageId } from "./navigation/PassportPageIndex";
import { PassportDocumentShell } from "./shell/PassportDocumentShell";
import { PassportEditSheet } from "./edit/PassportEditSheet";
import { PassportActionBar } from "./actions/PassportActionBar";
import { labelPassportOption, labelPassportOptions } from "./utils";
import "./passport-document.css";

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

  const reasons: { en: string; ar: string }[] = [];
  if (bp.skinType)
    reasons.push({ en: "Matches your skin profile", ar: "يتوافق مع ملف بشرتكِ" });
  if (bp.preferredFinish)
    reasons.push({ en: "Matches your preferred finish", ar: "يتوافق مع اللمسة المفضلة" });
  if (bp.beautyGoals.length)
    reasons.push({ en: "Matches your beauty goals", ar: "يتوافق مع أهداف جمالكِ" });
  if (bp.favoriteCategories.length || p.wishlistCount > 0)
    reasons.push({ en: "Matches your preferences", ar: "يتوافق مع تفضيلاتكِ" });

  return { percent: Math.min(96, score), reasons: reasons.slice(0, 4) };
}

export function PassportExperience() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passport, setPassport] = useState<PassportPayload | null>(null);
  const [opened, setOpened] = useState(false);
  const [coverOpening, setCoverOpening] = useState(false);
  const [page, setPage] = useState<PassportPageId>("identity");
  const [editOpen, setEditOpen] = useState(false);
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

  const applyPassport = useCallback((p: PassportPayload) => {
    setPassport(p);
    setDob(p.dateOfBirth || "");
    setGovernorate(p.governorate || "");
    setSkinType(p.beautyProfile.skinType || "");
    setSkinConcerns(p.beautyProfile.skinConcerns || []);
    setBeautyGoals(p.beautyProfile.beautyGoals || []);
    setMakeupStyle(p.beautyProfile.makeupStyle || "");
    setPreferredFinish(p.beautyProfile.preferredFinish || "");
    setFavoriteCategories(p.beautyProfile.favoriteCategories || []);
  }, []);

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
      applyPassport(data.passport);
      setOpened(Boolean(data.passport.passportOpenedAt));
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
  }, [ar, applyPassport]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, opened]);

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
        applyPassport(data.passport);
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
    [ar, applyPassport],
  );

  async function onOpenCover() {
    setCoverOpening(true);
    window.setTimeout(() => {
      setOpened(true);
      setCoverOpening(false);
    }, 480);
    await patch({ markOpened: true });
  }

  async function onSaveIdentity() {
    await patch({ dateOfBirth: dob || null, governorate: governorate || null });
    setEditOpen(false);
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
      await patch({ avatarUrl: await compressImage(file) });
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
    const items: { at: string; en: string; ar: string }[] = [
      {
        at: String(passport.memberSinceYear),
        en: "Joined VELORA",
        ar: "انضمامكِ إلى VELORA",
      },
    ];
    for (const a of passport.achievements.filter((x) => x.unlocked)) {
      items.push({
        at: a.unlockedAt
          ? new Date(a.unlockedAt).toLocaleDateString(ar ? "ar-IQ" : "en-GB", {
              month: "short",
              year: "numeric",
            })
          : "",
        en: a.nameEn,
        ar: a.nameAr,
      });
    }
    if (passport.journey.totalOrders > 0) {
      items.push({
        at: "",
        en: `${passport.journey.totalOrders} order(s)`,
        ar: `${passport.journey.totalOrders} طلب`,
      });
    }
    return items;
  }, [passport, ar]);

  if (loading) {
    return (
      <div className="vp-root" dir={ar ? "rtl" : "ltr"}>
        <div className="vp-shell">
          <div className="vp-skel" aria-hidden />
        </div>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="vp-root" dir={ar ? "rtl" : "ltr"}>
        <div className="vp-shell">
          <Link href="/account/my-velora" className="vp-back">
            ← MY VELORA
          </Link>
          <p className="vp-empty">{error || "—"}</p>
        </div>
      </div>
    );
  }

  const levelName = ar ? passport.level.nameAr : passport.level.nameEn;

  return (
    <div className="vp-root" dir={ar ? "rtl" : "ltr"}>
      <div className="vp-shell">
        <Link href="/account/my-velora" className="vp-back">
          ← MY VELORA
        </Link>

        {!opened ? (
          <PassportCover
            ar={ar}
            passportNumber={passport.passportNumber}
            levelName={levelName}
            opening={coverOpening}
            onOpen={() => void onOpenCover()}
          />
        ) : (
          <div className="vp-book-enter">
            {page === "identity" ? (
              <PassportIdentityPage
                ar={ar}
                passport={passport}
                onChangePhoto={() => fileRef.current?.click()}
              />
            ) : null}

            {page === "beauty" ? (
              <PassportDocumentShell
                pageLabel="02 — Beauty Profile"
                pageLabelAr="ملف الجمال"
                passportNumber={passport.passportNumber}
              >
                <div className="vp-page-content">
                  <h4>{ar ? "ملف جمالكِ" : "My Beauty Profile"}</h4>
                  {(skinType ||
                    skinConcerns.length ||
                    beautyGoals.length ||
                    makeupStyle ||
                    preferredFinish ||
                    favoriteCategories.length) ? (
                    <div className="vp-beauty-summary">
                      {skinType ? (
                        <p>
                          <span>{ar ? "البشرة" : "Skin"}</span>
                          {labelPassportOption(SKIN_TYPE_OPTIONS, skinType, ar)}
                        </p>
                      ) : null}
                      {skinConcerns.length ? (
                        <p>
                          <span>{ar ? "الاهتمامات" : "Concerns"}</span>
                          {labelPassportOptions(SKIN_CONCERN_OPTIONS, skinConcerns, ar)}
                        </p>
                      ) : null}
                      {beautyGoals.length ? (
                        <p>
                          <span>{ar ? "الأهداف" : "Goals"}</span>
                          {labelPassportOptions(BEAUTY_GOAL_OPTIONS, beautyGoals, ar)}
                        </p>
                      ) : null}
                      {makeupStyle ? (
                        <p>
                          <span>{ar ? "المكياج" : "Makeup"}</span>
                          {labelPassportOption(MAKEUP_STYLE_OPTIONS, makeupStyle, ar)}
                        </p>
                      ) : null}
                      {preferredFinish ? (
                        <p>
                          <span>{ar ? "اللمسة" : "Finish"}</span>
                          {labelPassportOption(FINISH_OPTIONS, preferredFinish, ar)}
                        </p>
                      ) : null}
                      {favoriteCategories.length ? (
                        <p>
                          <span>{ar ? "الفئات" : "Categories"}</span>
                          {labelPassportOptions(CATEGORY_OPTIONS, favoriteCategories, ar)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="vp-field__label">{ar ? "نوع البشرة" : "Skin Type"}</p>
                  <select
                    className="vp-sheet__field"
                    style={{ width: "100%", marginBottom: "0.75rem" }}
                    value={skinType}
                    onChange={(e) => setSkinType(e.target.value)}
                  >
                    <option value="">{ar ? "اختاري" : "Select"}</option>
                    {SKIN_TYPE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {ar ? o.ar : o.en}
                      </option>
                    ))}
                  </select>
                  <p className="vp-field__label">{ar ? "اهتمامات البشرة" : "Skin Concerns"}</p>
                  <div className="vp-chip-select">
                    {SKIN_CONCERN_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        data-on={skinConcerns.includes(o.id)}
                        onClick={() => setSkinConcerns(toggleIn(skinConcerns, o.id))}
                      >
                        {ar ? o.ar : o.en}
                      </button>
                    ))}
                  </div>
                  <p className="vp-field__label" style={{ marginTop: "0.75rem" }}>
                    {ar ? "أهداف الجمال" : "Beauty Goals"}
                  </p>
                  <div className="vp-chip-select">
                    {BEAUTY_GOAL_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        data-on={beautyGoals.includes(o.id)}
                        onClick={() => setBeautyGoals(toggleIn(beautyGoals, o.id))}
                      >
                        {ar ? o.ar : o.en}
                      </button>
                    ))}
                  </div>
                  <p className="vp-field__label" style={{ marginTop: "0.75rem" }}>
                    {ar ? "أسلوب المكياج" : "Makeup Style"}
                  </p>
                  <select
                    className="vp-sheet__field"
                    style={{ width: "100%", marginBottom: "0.75rem" }}
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
                  <p className="vp-field__label">{ar ? "اللمسة المفضلة" : "Preferred Finish"}</p>
                  <select
                    className="vp-sheet__field"
                    style={{ width: "100%", marginBottom: "0.75rem" }}
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
                  <p className="vp-field__label">{ar ? "الفئات المفضلة" : "Favorite Categories"}</p>
                  <div className="vp-chip-select">
                    {CATEGORY_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        data-on={favoriteCategories.includes(o.id)}
                        onClick={() =>
                          setFavoriteCategories(toggleIn(favoriteCategories, o.id))
                        }
                      >
                        {ar ? o.ar : o.en}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="vp-save-inline"
                    disabled={saving}
                    onClick={() => void onSaveBeauty()}
                  >
                    {saving ? "…" : ar ? "حفظ" : "Save Profile"}
                  </button>
                </div>
              </PassportDocumentShell>
            ) : null}

            {page === "journey" ? (
              <PassportDocumentShell
                pageLabel="03 — Journey"
                pageLabelAr="الرحلة"
                passportNumber={passport.passportNumber}
              >
                {timeline.length <= 1 && passport.journey.totalOrders === 0 ? (
                  <div className="vp-empty">
                    <p>{ar ? "رحلتكِ بدأت للتو." : "Your journey is just beginning."}</p>
                    <Link href="/shop" className="vp-link">
                      {ar ? "استكشفي VELORA" : "Explore VELORA"}
                    </Link>
                  </div>
                ) : (
                  <div className="vp-timeline">
                    {timeline.map((item, i) => (
                      <div key={`${item.en}-${i}`} className="vp-tl-item">
                        {item.at ? <time>{item.at}</time> : null}
                        <p>{ar ? item.ar : item.en}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="vp-stat-row">
                  <div className="vp-stat">
                    <b>{passport.journey.totalOrders}</b>
                    <span>{ar ? "طلبات" : "Orders"}</span>
                  </div>
                  <div className="vp-stat">
                    <b>{passport.journey.brandsTried}</b>
                    <span>{ar ? "علامات" : "Brands"}</span>
                  </div>
                </div>
              </PassportDocumentShell>
            ) : null}

            {page === "collection" ? (
              <PassportDocumentShell
                pageLabel="04 — Collection"
                pageLabelAr="المجموعة"
                passportNumber={passport.passportNumber}
              >
                <div className="vp-stat-row">
                  <Link href="/account?section=wishlist" className="vp-stat">
                    <b>{passport.wishlistCount}</b>
                    <span>{ar ? "المفضلة" : "Favorites"}</span>
                  </Link>
                  <Link href="/account?section=orders" className="vp-stat">
                    <b>{passport.journey.totalOrders}</b>
                    <span>{ar ? "مشتريات" : "Purchased"}</span>
                  </Link>
                </div>
              </PassportDocumentShell>
            ) : null}

            {page === "achievements" ? (
              <PassportDocumentShell
                pageLabel="05 — Achievements"
                pageLabelAr="الإنجازات"
                passportNumber={passport.passportNumber}
              >
                {passport.achievements.map((a) => (
                  <div key={a.key} className="vp-ach-item" data-locked={!a.unlocked}>
                    <span className="vp-ach-mark">{a.unlocked ? "✦" : "○"}</span>
                    <span>{ar ? a.nameAr : a.nameEn}</span>
                  </div>
                ))}
              </PassportDocumentShell>
            ) : null}

            {page === "level" ? (
              <PassportDocumentShell
                pageLabel="06 — Level & Rewards"
                pageLabelAr="المستوى"
                passportNumber={passport.passportNumber}
              >
                <div className="vp-level-display">
                  <div className="vp-level-display__name">
                    {levelName} {passport.level.mark}
                  </div>
                  <div className="vp-level-display__xp">
                    {passport.xp.toLocaleString()} XP
                    {passport.nextLevel
                      ? ` · ${passport.pointsToNext.toLocaleString()} ${ar ? "إلى" : "to"} ${ar ? passport.nextLevel.nameAr : passport.nextLevel.nameEn}`
                      : ""}
                  </div>
                  <div className="vp-progress">
                    <i style={{ width: `${Math.round(passport.progressRatio * 100)}%` }} />
                  </div>
                </div>
                <p className="vp-page-content" style={{ marginTop: "0.85rem", fontSize: "0.72rem" }}>
                  {ar
                    ? "XP = نقاط Beauty Club — نفس النظام الحالي."
                    : "XP = Beauty Club points — same underlying system."}
                </p>
                <Link href="/account/club" className="vp-link">
                  {ar ? "Beauty Club" : "Beauty Club"} →
                </Link>
              </PassportDocumentShell>
            ) : null}

            {page === "match" ? (
              <PassportDocumentShell
                pageLabel="07 — VELORA Match"
                pageLabelAr="التوافق"
                passportNumber={passport.passportNumber}
              >
                {!match ? (
                  <div className="vp-empty">
                    <p>{ar ? "أكملي ملف الجمال." : "Complete your beauty profile."}</p>
                    <button type="button" className="vp-save-inline" onClick={() => setPage("beauty")}>
                      {ar ? "ملف الجمال" : "Beauty Profile"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="vp-level-display">
                      <div className="vp-level-display__name">{match.percent}%</div>
                      <div className="vp-level-display__xp">
                        {ar ? "توافق جمالي" : "Beauty Match"}
                      </div>
                    </div>
                    {match.reasons.map((r) => (
                      <div key={r.en} className="vp-ach-item">
                        <span className="vp-ach-mark">✓</span>
                        <span>{ar ? r.ar : r.en}</span>
                      </div>
                    ))}
                  </>
                )}
              </PassportDocumentShell>
            ) : null}

            {page === "prive" ? (
              <PassportDocumentShell
                pageLabel="08 — VELORA Privé"
                pageLabelAr="بريفيه"
                passportNumber={passport.passportNumber}
              >
                {passport.level.id === "prive" ? (
                  ["Priority Access", "Exclusive Drops", "Private Offers", "Birthday Rewards"].map(
                    (b) => (
                      <div key={b} className="vp-ach-item">
                        <span className="vp-ach-mark">✦</span>
                        <span>{b}</span>
                      </div>
                    ),
                  )
                ) : (
                  <div className="vp-empty">
                    <p>
                      {ar
                        ? `مستواكِ ${levelName}. واصلي للوصول إلى PRIVÉ.`
                        : `You're at ${levelName}. Reach PRIVÉ for exclusive benefits.`}
                    </p>
                    <Link href="/account/club" className="vp-link">
                      {ar ? "مزايا النادي" : "Club benefits"}
                    </Link>
                  </div>
                )}
                {passport.isBirthdayToday ? (
                  <div className="vp-level-display" style={{ marginTop: "1rem" }}>
                    <div className="vp-level-display__name">
                      {ar ? "عيد ميلاد سعيد ✦" : "Happy Birthday ✦"}
                    </div>
                  </div>
                ) : null}
              </PassportDocumentShell>
            ) : null}

            {message ? <p className="vp-toast">{message}</p> : null}

            <div className="vp-dock">
              {page === "identity" ? (
                <PassportActionBar
                  ar={ar}
                  onEdit={() => setEditOpen(true)}
                />
              ) : null}
              <PassportPageIndex ar={ar} active={page} onChange={setPage} />
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onAvatar(e.target.files?.[0] ?? null)}
        />

        <PassportEditSheet
          ar={ar}
          open={editOpen}
          dob={dob}
          governorate={governorate}
          saving={saving}
          onClose={() => setEditOpen(false)}
          onDobChange={setDob}
          onGovernorateChange={setGovernorate}
          onSave={() => void onSaveIdentity()}
        />
      </div>
    </div>
  );
}
