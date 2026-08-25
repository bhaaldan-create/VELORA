"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { VeloraSignatureCard } from "@/components/my-velora/VeloraSignatureCard";
import {
  CARD_STYLE_OPTIONS,
  type VeloraCardPayload,
  type VeloraCardStyleKey,
} from "@/lib/my-velora/types";
import {
  downloadMyVeloraPng,
  shareMyVeloraCard,
  shareMyVeloraToInstagramStories,
} from "@/lib/my-velora/card-image";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";
import "./my-velora.css";

type Props = {
  orderId: string;
  cardId: string;
  initialPayload: VeloraCardPayload;
  initialStyleKey: VeloraCardStyleKey;
  hasReview: boolean;
  reviewRewardPoints: number;
};

export function MyVeloraPreview({
  orderId,
  initialPayload,
  initialStyleKey,
  hasReview,
  reviewRewardPoints,
}: Props) {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const [styleKey, setStyleKey] = useState(initialStyleKey);
  const [payload] = useState(initialPayload);
  const [styleOpen, setStyleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharingIg, setSharingIg] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(hasReview);

  const qrDataUrl = useMemo(() => {
    if (!payload.showQrCode) return null;
    return `/api/my-velora/qr?data=${encodeURIComponent(payload.referralUrl)}`;
  }, [payload.referralUrl, payload.showQrCode]);

  const previewScale = useMemo(() => {
    if (typeof window === "undefined") return 0.35;
    const maxH = Math.min(window.innerHeight * 0.72, 760);
    const maxW = window.innerWidth - 32;
    return Math.min(maxW / 1080, maxH / 1920, 1);
  }, []);

  const recordEvent = useCallback(
    async (eventType: string, meta?: Record<string, unknown>) => {
      try {
        await fetch(`/api/auth/my-velora/${orderId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType, meta, styleKey }),
        });
      } catch {
        /* non-blocking */
      }
    },
    [orderId, styleKey],
  );

  useEffect(() => {
    void recordEvent("view");
  }, [recordEvent]);

  async function onStyleChange(next: VeloraCardStyleKey) {
    setStyleKey(next);
    setStyleOpen(false);
    await fetch(`/api/auth/my-velora/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleKey: next }),
    });
    await recordEvent("style_change", { styleKey: next });
  }

  async function onSave() {
    setSaving(true);
    setMessage(null);
    try {
      await downloadMyVeloraPng(orderId);
      await recordEvent("save");
      setMessage(
        ar
          ? "تم حفظ الصورة بجودة 1080×1920 ✦"
          : "Saved as 1080×1920 PNG ✦",
      );
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : ar
            ? "تعذّر حفظ الصورة"
            : "Could not save image",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onInstagramStories() {
    setSharingIg(true);
    setMessage(null);
    try {
      const mode = await shareMyVeloraToInstagramStories({
        orderId,
        title: "MY VELORA ✦",
        text: ar ? payload.pointsLabelAr : payload.pointsLabelEn,
      });
      await recordEvent("instagram_share", { mode });
      if (mode === "native-file") {
        setMessage(
          ar
            ? "اختاري Instagram ثم Story من قائمة المشاركة ✦"
            : "Choose Instagram → Story in the share sheet ✦",
        );
      } else if (mode === "download-instagram") {
        setMessage(
          ar
            ? "تم حفظ الصورة. افتحي Instagram Stories وأضيفيها من المعرض ✦"
            : "Image saved. Open Instagram Stories and add it from your gallery ✦",
        );
      } else {
        setMessage(
          ar
            ? "تم تنزيل الصورة — ارفعيها يدوياً على Instagram Stories"
            : "Image downloaded — upload it to Instagram Stories",
        );
      }
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : ar
            ? "تعذّرت المشاركة على Instagram"
            : "Instagram share failed",
      );
    } finally {
      setSharingIg(false);
    }
  }

  async function onShare() {
    setSharing(true);
    setMessage(null);
    try {
      const mode = await shareMyVeloraCard({
        title: "MY VELORA ✦",
        text: ar ? payload.pointsLabelAr : payload.pointsLabelEn,
        url: payload.referralUrl,
        orderId,
      });
      await recordEvent("share", { mode });
      setMessage(
        mode === "clipboard"
          ? ar
            ? "تم نسخ الرابط ✦"
            : "Link copied ✦"
          : ar
            ? "شكراً لمشاركة لحظتك ✦"
            : "Thank you for sharing ✦",
      );
    } catch {
      setMessage(ar ? "تعذّرت المشاركة" : "Share failed");
    } finally {
      setSharing(false);
    }
  }

  async function onCopyLink() {
    try {
      await navigator.clipboard.writeText(payload.referralUrl);
      await recordEvent("share", { channel: "copy_link" });
      setMessage(ar ? "تم نسخ الرابط ✦" : "Link copied ✦");
    } catch {
      setMessage(ar ? "تعذّر النسخ" : "Copy failed");
    }
  }

  async function onSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/auth/my-velora/${orderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = (await res.json()) as { ok?: boolean; pointsAwarded?: number };
      if (!res.ok || !data.ok) throw new Error("review failed");
      setReviewDone(true);
      setMessage(
        data.pointsAwarded
          ? ar
            ? `شكراً! +${data.pointsAwarded} نقطة ✦`
            : `Thank you! +${data.pointsAwarded} points ✦`
          : ar
            ? "شكراً لتقييمك ✦"
            : "Thank you for your review ✦",
      );
    } catch {
      setMessage(ar ? "تعذّر إرسال التقييم" : "Review failed");
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <div className="mv-preview-shell mx-auto flex min-h-[100dvh] max-w-lg flex-col bg-[#F6F0F8] px-4 pb-8 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <Link
          href="/account/my-velora"
          className="text-[0.9rem] text-[#5E4A66] transition-opacity hover:opacity-70"
        >
          {ar ? "← رجوع" : "← Back"}
        </Link>
        <p className="font-latin text-[0.72rem] tracking-[0.32em] text-[#8B7A92]">
          MY VELORA
        </p>
      </header>

      <div className="mv-fade-in mx-auto flex flex-1 flex-col items-center">
        <div
          className="mv-preview-frame relative overflow-hidden rounded-[28px] shadow-[0_24px_80px_rgba(61,38,64,0.18)]"
          style={{ height: 1920 * previewScale }}
        >
          <div
            className="absolute left-1/2 top-0 mv-slide-up"
            style={{
              width: 1080,
              height: 1920,
              transform: `translateX(-50%) scale(${previewScale})`,
              transformOrigin: "top center",
            }}
          >
            <VeloraSignatureCard
              payload={payload}
              styleKey={styleKey}
              locale={ar ? "ar" : "en"}
              qrDataUrl={qrDataUrl}
            />
          </div>
        </div>

        <div className="mt-5 flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={onInstagramStories}
            disabled={sharingIg || saving}
            className="w-full rounded-full bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] px-5 py-3 text-[0.9rem] font-medium text-white shadow-[0_10px_28px_-12px_rgba(221,42,123,0.55)] disabled:opacity-60"
          >
            {sharingIg
              ? ar
                ? "جارٍ تجهيز الستوري…"
                : "Preparing Story…"
              : ar
                ? "مشاركة على Instagram Stories ✦"
                : "Share to Instagram Stories ✦"}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setStyleOpen((v) => !v)}
              className="rounded-full border border-[#D8CCE3] bg-white/80 px-4 py-2 text-[0.82rem] text-[#4A384F]"
            >
              {ar ? "الأسلوب" : "Style"}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || sharingIg}
              className="rounded-full bg-[#3D2640] px-5 py-2 text-[0.82rem] text-white disabled:opacity-60"
            >
              {saving ? "…" : ar ? "حفظ في الصور" : "Save to Photos"}
            </button>
            <button
              type="button"
              onClick={onShare}
              disabled={sharing || sharingIg}
              className="rounded-full border border-[#3D2640] bg-white/80 px-5 py-2 text-[0.82rem] text-[#3D2640]"
            >
              {sharing ? "…" : ar ? "مشاركة" : "Share"}
            </button>
            <button
              type="button"
              onClick={onCopyLink}
              className="rounded-full px-3 py-2 text-[0.78rem] text-[#7A6880] underline-offset-2 hover:underline"
            >
              {ar ? "نسخ الرابط" : "Copy link"}
            </button>
          </div>
        </div>

        {styleOpen ? (
          <div className="mt-4 w-full rounded-[22px] border border-[#E5DAEE] bg-white/90 p-3">
            <p className="mb-2 text-center text-[0.78rem] tracking-[0.2em] text-[#8B7A92]">
              {ar ? "اختاري أسلوبك" : "Choose your style"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CARD_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onStyleChange(opt.key)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-[0.78rem] transition-colors",
                    styleKey === opt.key
                      ? "bg-[#3D2640] text-white"
                      : "bg-[#F3ECF7] text-[#4A384F] hover:bg-[#EAE0F0]",
                  )}
                >
                  {ar ? opt.nameAr : opt.nameEn}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {message ? (
          <p className="mt-4 text-center text-[0.85rem] leading-relaxed text-[#5E4A66]">
            {message}
          </p>
        ) : null}
      </div>

      {!reviewDone ? (
        <section className="mt-8 rounded-[24px] border border-[#E5DAEE] bg-white/85 p-5">
          <h2 className="text-center font-display text-[1.05rem] text-[#3D2640]">
            {ar ? "كيف كانت تجربتك مع VELORA؟" : "How was your VELORA experience?"}
          </h2>
          <form onSubmit={onSubmitReview} className="mt-4 space-y-4">
            <div className="flex justify-center gap-1 text-[1.6rem]">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={cn(
                    "transition-transform hover:scale-110",
                    rating >= n ? "text-[#C9A227]" : "text-[#D8CCE3]",
                  )}
                  aria-label={`${n}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={ar ? "تعليق اختياري…" : "Optional comment…"}
              className="min-h-[80px] w-full rounded-2xl border border-[#E5DAEE] bg-[#FBF8FC] px-4 py-3 text-[0.88rem] outline-none focus:border-[#C4B0D4]"
            />
            {reviewRewardPoints > 0 ? (
              <p className="text-center text-[0.78rem] text-[#8B7A92]">
                {ar
                  ? `قد تحصلين على +${reviewRewardPoints} نقطة عند التقييم`
                  : `You may earn +${reviewRewardPoints} points for reviewing`}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={rating < 1 || reviewSubmitting}
              className="w-full rounded-full bg-[#3D2640] py-3 text-[0.88rem] text-white disabled:opacity-50"
            >
              {reviewSubmitting ? "…" : ar ? "إرسال التقييم" : "Submit review"}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
