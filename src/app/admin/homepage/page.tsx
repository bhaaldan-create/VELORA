"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { isEphemeralClientImageUrl } from "@/lib/admin/media-url";
import { parseJsonResponse } from "@/lib/admin/parse-json-response";
import {
  DEFAULT_HOME_CATEGORIES,
  DEFAULT_HOME_HERO,
  DEFAULT_HOME_PROMO,
} from "@/lib/home/default-config";
import type {
  HomeCategoryCard,
  HomeCategoryConfig,
  HomeHeroConfig,
  HomeHeroSlide,
  HomePromoConfig,
} from "@/lib/home/types";

export default function AdminHomepagePage() {
  const [config, setConfig] = useState<HomeHeroConfig>(DEFAULT_HOME_HERO);
  const [categories, setCategories] = useState<HomeCategoryConfig>(
    DEFAULT_HOME_CATEGORIES,
  );
  const [promo, setPromo] = useState<HomePromoConfig>(DEFAULT_HOME_PROMO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/home-hero").then((r) => r.json()),
      fetch("/api/admin/home-categories").then((r) => r.json()),
      fetch("/api/admin/home-promo").then((r) => r.json()),
    ])
      .then(
        ([heroData, categoryData, promoData]: [
          { ok?: boolean; config?: HomeHeroConfig },
          { ok?: boolean; config?: HomeCategoryConfig },
          { ok?: boolean; config?: HomePromoConfig },
        ]) => {
          if (heroData.config) setConfig(heroData.config);
          if (categoryData.config) setCategories(categoryData.config);
          if (promoData.config) setPromo(promoData.config);
        },
      )
      .catch(() => setError("تعذّر تحميل إعدادات الصفحة الرئيسية."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      // لا نعيد إرسال صور data: الضخمة — الرفع يحفظها مسبقاً والسيرفر يحتفظ بها
      const payload: HomeHeroConfig = {
        ...config,
        slides: config.slides.map((s) => ({
          ...s,
          imageUrl: isEphemeralClientImageUrl(s.imageUrl) ? "" : s.imageUrl,
          imageUrlMobile: s.imageUrlMobile
            ? isEphemeralClientImageUrl(s.imageUrlMobile)
              ? ""
              : s.imageUrlMobile
            : s.imageUrlMobile,
        })),
      };
      const res = await fetch("/api/admin/home-hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: payload }),
      });
      const data = await parseJsonResponse<{
        ok?: boolean;
        config?: HomeHeroConfig;
        error?: string;
      }>(res);
      if (!res.ok || !data.ok) {
        setError(data.error || "فشل الحفظ.");
        return;
      }
      if (data.config) setConfig(data.config);
      setMessage("تم حفظ شرائح الهيرو.");
    } catch (err) {
      setError(
        err instanceof Error
          ? `فشل الحفظ: ${err.message}`
          : "فشل الحفظ. جرّبي حفظ النصوص بعد رفع الصور، أو صغّري حجم الصورة.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveCategories() {
    setSavingCategories(true);
    setMessage(null);
    setError(null);
    try {
      const payload: HomeCategoryConfig = {
        ...categories,
        cards: categories.cards.map((c) => ({
          ...c,
          imageUrl: isEphemeralClientImageUrl(c.imageUrl) ? "" : c.imageUrl,
        })),
      };
      const res = await fetch("/api/admin/home-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: payload }),
      });
      const data = await parseJsonResponse<{
        ok?: boolean;
        config?: HomeCategoryConfig;
        error?: string;
      }>(res);
      if (!res.ok || !data.ok) {
        setError(data.error || "فشل حفظ الفئات.");
        return;
      }
      if (data.config) setCategories(data.config);
      setMessage("تم حفظ بطاقات «تسوق حسب الفئة».");
    } catch (err) {
      setError(
        err instanceof Error
          ? `فشل حفظ الفئات: ${err.message}`
          : "فشل حفظ الفئات.",
      );
    } finally {
      setSavingCategories(false);
    }
  }

  async function savePromo() {
    setSavingPromo(true);
    setMessage(null);
    setError(null);
    try {
      const payload: HomePromoConfig = {
        ...promo,
        imageUrl: isEphemeralClientImageUrl(promo.imageUrl) ? "" : promo.imageUrl,
      };
      const res = await fetch("/api/admin/home-promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: payload }),
      });
      const data = await parseJsonResponse<{
        ok?: boolean;
        config?: HomePromoConfig;
        error?: string;
      }>(res);
      if (!res.ok || !data.ok) {
        setError(data.error || "فشل حفظ بانر وصل حديثاً.");
        return;
      }
      if (data.config) setPromo(data.config);
      setMessage("تم حفظ بانر «وصل حديثاً».");
    } catch (err) {
      setError(
        err instanceof Error
          ? `فشل حفظ البانر: ${err.message}`
          : "فشل حفظ البانر.",
      );
    } finally {
      setSavingPromo(false);
    }
  }

  async function uploadPromoImage(file: File) {
    setUploading("promo");
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/home-promo/image", {
        method: "POST",
        body: form,
      });
      const data = await parseJsonResponse<{
        ok?: boolean;
        imageUrl?: string;
        error?: string;
      }>(res);
      if (!res.ok || !data.ok || !data.imageUrl) {
        setError(data.error || "فشل رفع صورة البانر.");
        return;
      }
      setPromo((prev) => ({ ...prev, imageUrl: data.imageUrl! }));
      setMessage("تم تحديث صورة بانر «وصل حديثاً».");
    } catch (err) {
      setError(
        err instanceof Error
          ? `فشل رفع صورة البانر: ${err.message}`
          : "فشل رفع صورة البانر.",
      );
    } finally {
      setUploading(null);
    }
  }

  function patchSlide(index: number, patch: Partial<HomeHeroSlide>) {
    setConfig((prev) => {
      const slides = [...prev.slides];
      slides[index] = { ...slides[index]!, ...patch };
      return { ...prev, slides };
    });
  }

  function patchCard(index: number, patch: Partial<HomeCategoryCard>) {
    setCategories((prev) => {
      const cards = [...prev.cards];
      cards[index] = { ...cards[index]!, ...patch };
      return { ...prev, cards };
    });
  }

  async function uploadImage(
    slideId: string,
    variant: "desktop" | "mobile",
    file: File,
  ) {
    setUploading(`${slideId}-${variant}`);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("slideId", slideId);
      form.set("variant", variant);
      form.set("file", file);
      const res = await fetch("/api/admin/home-hero/image", {
        method: "POST",
        body: form,
      });
      const data = await parseJsonResponse<{
        ok?: boolean;
        imageUrl?: string;
        error?: string;
      }>(res);
      if (!res.ok || !data.ok || !data.imageUrl) {
        setError(data.error || "فشل رفع الصورة.");
        return;
      }
      setConfig((prev) => ({
        ...prev,
        slides: prev.slides.map((s) =>
          s.id === slideId
            ? variant === "mobile"
              ? { ...s, imageUrlMobile: data.imageUrl! }
              : { ...s, imageUrl: data.imageUrl! }
            : s,
        ),
      }));
      setMessage(
        variant === "mobile"
          ? "تم تحديث صورة الموبايل."
          : "تم تحديث صورة سطح المكتب.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? `فشل رفع الصورة: ${err.message}`
          : "فشل رفع الصورة.",
      );
    } finally {
      setUploading(null);
    }
  }

  async function uploadCategoryImage(cardId: string, file: File) {
    setUploading(`category-${cardId}`);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("cardId", cardId);
      form.set("file", file);
      const res = await fetch("/api/admin/home-categories/image", {
        method: "POST",
        body: form,
      });
      const data = await parseJsonResponse<{
        ok?: boolean;
        imageUrl?: string;
        error?: string;
      }>(res);
      if (!res.ok || !data.ok || !data.imageUrl) {
        setError(data.error || "فشل رفع صورة الفئة.");
        return;
      }
      setCategories((prev) => ({
        ...prev,
        cards: prev.cards.map((c) =>
          c.id === cardId ? { ...c, imageUrl: data.imageUrl! } : c,
        ),
      }));
      setMessage("تم تحديث صورة الفئة.");
    } catch (err) {
      setError(
        err instanceof Error
          ? `فشل رفع صورة الفئة: ${err.message}`
          : "فشل رفع صورة الفئة.",
      );
    } finally {
      setUploading(null);
    }
  }

  return (
    <AdminShell active="homepage" title="الصفحة الرئيسية">
      <PageHeader
        title="هيرو الصفحة الرئيسية"
        description="ارفعي الصور أولاً (تُحفظ فوراً)، ثم احفظي النصوص والأزرار. لا حاجة لإعادة رفع الصورة عند الحفظ."
        actions={
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loading}
            className="rounded-full bg-[var(--admin-text)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "جارٍ الحفظ…" : "حفظ الهيرو"}
          </button>
        }
      />
      {message ? (
        <p className="mb-4 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">جارٍ التحميل…</p>
      ) : (
        <div className="space-y-5">
          <Surface className="p-5">
            <label className="block text-sm">
              <span className="mb-1.5 block text-[var(--admin-text-secondary)]">
                مدة العرض التلقائي (مللي ثانية)
              </span>
              <input
                type="number"
                min={3000}
                step={500}
                className="w-full max-w-xs rounded-xl border border-[var(--admin-border)] bg-white px-3 py-2"
                value={config.autoplayMs}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    autoplayMs: Number(e.target.value) || 5500,
                  }))
                }
              />
            </label>
          </Surface>

          {config.slides.map((slide, index) => (
            <Surface key={slide.id} className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-medium text-[var(--admin-text)]">
                  شريحة {index + 1}{" "}
                  <span className="text-[var(--admin-text-secondary)]">
                    ({slide.id})
                  </span>
                </h3>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={slide.enabled}
                    onChange={(e) =>
                      patchSlide(index, { enabled: e.target.checked })
                    }
                  />
                  مفعّلة
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    العنوان (عربي)
                  </span>
                  <input
                    className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    value={slide.headlineAr}
                    onChange={(e) =>
                      patchSlide(index, { headlineAr: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    Headline (EN)
                  </span>
                  <input
                    className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    value={slide.headlineEn}
                    onChange={(e) =>
                      patchSlide(index, { headlineEn: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm lg:col-span-2">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    النص (عربي)
                  </span>
                  <textarea
                    className="min-h-[72px] w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    value={slide.bodyAr}
                    onChange={(e) =>
                      patchSlide(index, { bodyAr: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm lg:col-span-2">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    Body (EN)
                  </span>
                  <textarea
                    className="min-h-[72px] w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    value={slide.bodyEn}
                    onChange={(e) =>
                      patchSlide(index, { bodyEn: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    زر CTA (عربي)
                  </span>
                  <input
                    className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    value={slide.ctaAr}
                    onChange={(e) =>
                      patchSlide(index, { ctaAr: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    CTA (EN)
                  </span>
                  <input
                    className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    value={slide.ctaEn}
                    onChange={(e) =>
                      patchSlide(index, { ctaEn: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm lg:col-span-2">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    رابط الزر
                  </span>
                  <input
                    className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    dir="ltr"
                    value={slide.href}
                    onChange={(e) =>
                      patchSlide(index, { href: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm text-[var(--admin-text-secondary)]">
                    صورة سطح المكتب
                  </p>
                  <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-xl bg-[var(--admin-surface-soft)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <label className="inline-flex cursor-pointer rounded-full border border-[var(--admin-border)] bg-white px-4 py-2 text-sm">
                    {uploading === `${slide.id}-desktop`
                      ? "جارٍ الرفع…"
                      : "رفع صورة سطح المكتب"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={Boolean(uploading)}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadImage(slide.id, "desktop", f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div>
                  <p className="mb-2 text-sm text-[var(--admin-text-secondary)]">
                    صورة الموبايل (اختياري)
                  </p>
                  <div className="relative mb-3 aspect-[3/4] max-w-[220px] overflow-hidden rounded-xl bg-[var(--admin-surface-soft)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.imageUrlMobile || slide.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <label className="inline-flex cursor-pointer rounded-full border border-[var(--admin-border)] bg-white px-4 py-2 text-sm">
                    {uploading === `${slide.id}-mobile`
                      ? "جارٍ الرفع…"
                      : "رفع صورة الموبايل"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={Boolean(uploading)}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadImage(slide.id, "mobile", f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    موضع الصورة
                  </span>
                  <input
                    className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    dir="ltr"
                    placeholder="center 70%"
                    value={slide.objectPosition || ""}
                    onChange={(e) =>
                      patchSlide(index, { objectPosition: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    محاذاة النص
                  </span>
                  <select
                    className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    value={slide.textAlign || "start"}
                    onChange={(e) =>
                      patchSlide(index, {
                        textAlign: e.target.value as HomeHeroSlide["textAlign"],
                      })
                    }
                  >
                    <option value="start">بداية</option>
                    <option value="center">وسط</option>
                    <option value="end">نهاية</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-[var(--admin-text-secondary)]">
                    طبقة التعتيم
                  </span>
                  <select
                    className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                    value={slide.overlay || "medium"}
                    onChange={(e) =>
                      patchSlide(index, {
                        overlay: e.target.value as HomeHeroSlide["overlay"],
                      })
                    }
                  >
                    <option value="none">بدون</option>
                    <option value="soft">خفيف</option>
                    <option value="medium">متوسط</option>
                    <option value="strong">قوي</option>
                  </select>
                </label>
              </div>
            </Surface>
          ))}

          <div className="pt-4">
            <PageHeader
              title="تسوق حسب الفئة"
              description="ارفعي الصورة أولاً (تُحفظ فوراً)، ثم احفظي العناوين والروابط."
              actions={
                <button
                  type="button"
                  onClick={() => void saveCategories()}
                  disabled={savingCategories || loading}
                  className="rounded-full bg-[var(--admin-text)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {savingCategories ? "جارٍ الحفظ…" : "حفظ الفئات"}
                </button>
              }
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {categories.cards.map((card, index) => (
              <Surface key={card.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-[var(--admin-text)]">
                    بطاقة {index + 1}{" "}
                    <span className="text-[var(--admin-text-secondary)]">
                      ({card.id})
                    </span>
                  </h3>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={card.enabled}
                      onChange={(e) =>
                        patchCard(index, { enabled: e.target.checked })
                      }
                    />
                    مفعّلة
                  </label>
                </div>

                <div className="relative aspect-[3/4] max-h-[320px] overflow-hidden rounded-xl bg-[var(--admin-surface-soft)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: card.objectPosition || "center center",
                    }}
                  />
                </div>

                <label className="inline-flex cursor-pointer rounded-full border border-[var(--admin-border)] bg-white px-4 py-2 text-sm">
                  {uploading === `category-${card.id}`
                    ? "جارٍ الرفع…"
                    : "رفع صورة الفئة"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={Boolean(uploading)}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadCategoryImage(card.id, f);
                      e.target.value = "";
                    }}
                  />
                </label>

                <div className="grid gap-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-[var(--admin-text-secondary)]">
                      العنوان (عربي)
                    </span>
                    <input
                      className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                      value={card.titleAr}
                      onChange={(e) =>
                        patchCard(index, { titleAr: e.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-[var(--admin-text-secondary)]">
                      Title (EN)
                    </span>
                    <input
                      className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                      value={card.titleEn}
                      onChange={(e) =>
                        patchCard(index, { titleEn: e.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-[var(--admin-text-secondary)]">
                      نص الزر (عربي)
                    </span>
                    <input
                      className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                      value={card.ctaAr}
                      onChange={(e) =>
                        patchCard(index, { ctaAr: e.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-[var(--admin-text-secondary)]">
                      رابط البطاقة
                    </span>
                    <input
                      className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                      dir="ltr"
                      value={card.href}
                      onChange={(e) =>
                        patchCard(index, { href: e.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-[var(--admin-text-secondary)]">
                      موضع الصورة
                    </span>
                    <input
                      className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                      dir="ltr"
                      placeholder="center center"
                      value={card.objectPosition || ""}
                      onChange={(e) =>
                        patchCard(index, { objectPosition: e.target.value })
                      }
                    />
                  </label>
                </div>
              </Surface>
            ))}
          </div>

          <div className="pt-4">
            <PageHeader
              title="بانر «وصل حديثاً»"
              description="البانر البنفسجي بين الفئات وقسم المنتجات — ارفعي الصورة أولاً ثم احفظي النصوص."
              actions={
                <button
                  type="button"
                  onClick={() => void savePromo()}
                  disabled={savingPromo || loading}
                  className="rounded-full bg-[var(--admin-text)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {savingPromo ? "جارٍ الحفظ…" : "حفظ البانر"}
                </button>
              }
            />
          </div>

          <Surface className="space-y-4 p-5">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={promo.enabled}
                onChange={(e) =>
                  setPromo((p) => ({ ...p, enabled: e.target.checked }))
                }
              />
              إظهار البانر على الصفحة الرئيسية
            </label>

            <div className="relative aspect-[16/9] max-h-[280px] overflow-hidden rounded-xl bg-[var(--admin-surface-soft)] sm:max-w-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={promo.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                style={{
                  objectPosition: promo.objectPosition || "left center",
                }}
              />
            </div>

            <label className="inline-flex cursor-pointer rounded-full border border-[var(--admin-border)] bg-white px-4 py-2 text-sm">
              {uploading === "promo" ? "جارٍ الرفع…" : "رفع صورة البانر"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={Boolean(uploading)}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPromoImage(f);
                  e.target.value = "";
                }}
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--admin-text-secondary)]">
                  العنوان (عربي)
                </span>
                <input
                  className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                  value={promo.headlineAr}
                  onChange={(e) =>
                    setPromo((p) => ({ ...p, headlineAr: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--admin-text-secondary)]">
                  Headline (EN)
                </span>
                <input
                  className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                  value={promo.headlineEn}
                  onChange={(e) =>
                    setPromo((p) => ({ ...p, headlineEn: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm lg:col-span-2">
                <span className="mb-1 block text-[var(--admin-text-secondary)]">
                  النص (عربي)
                </span>
                <textarea
                  className="min-h-[72px] w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                  value={promo.bodyAr}
                  onChange={(e) =>
                    setPromo((p) => ({ ...p, bodyAr: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm lg:col-span-2">
                <span className="mb-1 block text-[var(--admin-text-secondary)]">
                  Body (EN)
                </span>
                <textarea
                  className="min-h-[72px] w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                  value={promo.bodyEn}
                  onChange={(e) =>
                    setPromo((p) => ({ ...p, bodyEn: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--admin-text-secondary)]">
                  زر CTA (عربي)
                </span>
                <input
                  className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                  value={promo.ctaAr}
                  onChange={(e) =>
                    setPromo((p) => ({ ...p, ctaAr: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--admin-text-secondary)]">
                  CTA (EN)
                </span>
                <input
                  className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                  value={promo.ctaEn}
                  onChange={(e) =>
                    setPromo((p) => ({ ...p, ctaEn: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm lg:col-span-2">
                <span className="mb-1 block text-[var(--admin-text-secondary)]">
                  رابط الزر
                </span>
                <input
                  className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                  dir="ltr"
                  value={promo.href}
                  onChange={(e) =>
                    setPromo((p) => ({ ...p, href: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--admin-text-secondary)]">
                  موضع الصورة
                </span>
                <input
                  className="w-full rounded-xl border border-[var(--admin-border)] px-3 py-2"
                  dir="ltr"
                  placeholder="left center"
                  value={promo.objectPosition || ""}
                  onChange={(e) =>
                    setPromo((p) => ({ ...p, objectPosition: e.target.value }))
                  }
                />
              </label>
            </div>
          </Surface>
        </div>
      )}
    </AdminShell>
  );
}
