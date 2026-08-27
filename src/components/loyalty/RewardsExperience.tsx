"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { LoyaltyMembershipCard } from "@/components/loyalty/LoyaltyMembershipCard";
import { useLocale } from "@/context/LocaleContext";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

type LoyaltyPayload = {
  ok: boolean;
  balance?: {
    available: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    pending: number;
  };
  referral?: { code: string; url: string; successfulCount: number };
  activity?: {
    id: string;
    points: number;
    labelAr: string;
    labelEn: string;
    createdAt: string;
  }[];
  config?: {
    waysToEarn: {
      id: string;
      titleAr: string;
      titleEn: string;
      detailAr: string;
      detailEn: string;
    }[];
  };
  error?: string;
};

export function RewardsExperience() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const [data, setData] = useState<LoyaltyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [qrMsg, setQrMsg] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/loyalty", { cache: "no-store" });
      const json = (await res.json()) as LoyaltyPayload;
      if (!res.ok || !json.ok) {
        setError(json.error || (ar ? "تعذّر التحميل." : "Failed to load."));
        return;
      }
      setData(json);
    } catch {
      setError(ar ? "تعذّر التحميل." : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    void load();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [load]);

  async function recordShare() {
    try {
      await fetch("/api/auth/loyalty/share", { method: "POST" });
    } catch {
      // non-blocking — share still works
    }
  }

  async function onCopy() {
    if (!data?.referral?.url) return;
    try {
      await navigator.clipboard.writeText(data.referral.url);
      setShareMsg(ar ? "تم نسخ الرابط." : "Link copied.");
      await recordShare();
      void load();
    } catch {
      setShareMsg(ar ? "تعذّر النسخ." : "Could not copy.");
    }
  }

  async function onWhatsApp() {
    if (!data?.referral?.url) return;
    const text = encodeURIComponent(
      ar
        ? `انضمّي إلى Velora Beauty عبر رابط دعوتي: ${data.referral.url}`
        : `Join Velora Beauty with my invite: ${data.referral.url}`,
    );
    await recordShare();
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    void load();
  }

  async function onNativeShare() {
    if (!data?.referral?.url) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Velora Beauty",
          text: ar ? "انضمّي إلى Velora Beauty" : "Join Velora Beauty",
          url: data.referral.url,
        });
        await recordShare();
        void load();
      } else {
        await onCopy();
      }
    } catch {
      // user cancelled
    }
  }

  async function claimCode(code: string) {
    setQrBusy(true);
    setQrMsg(null);
    try {
      const res = await fetch("/api/auth/loyalty/qr/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        awarded?: number;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setQrMsg(json.error || (ar ? "تعذّر المطالبة." : "Claim failed."));
        return;
      }
      setQrMsg(
        ar
          ? `تمت إضافة ${json.awarded ?? 0} نقطة.`
          : `Added ${json.awarded ?? 0} points.`,
      );
      setQrCode("");
      void load();
    } catch {
      setQrMsg(ar ? "تعذّر المطالبة." : "Claim failed.");
    } finally {
      setQrBusy(false);
    }
  }

  async function onClaimQr(e: FormEvent) {
    e.preventDefault();
    await claimCode(qrCode.trim());
  }

  async function startScan() {
    setQrMsg(null);
    // BarcodeDetector is Chromium-only; fall back to manual entry.
    type Detector = {
      detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
    };
    const BD = (
      window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
      }
    ).BarcodeDetector;
    if (!BD || !navigator.mediaDevices?.getUserMedia) {
      setQrMsg(
        ar
          ? "الماسح غير مدعوم على هذا الجهاز — أدخلي الرمز يدوياً."
          : "Scanner unavailable — enter the code manually.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
      await new Promise((r) => setTimeout(r, 50));
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const detector = new BD({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const codes = await detector.detect(video);
          const value = codes[0]?.rawValue?.trim();
          if (value) {
            stopScan();
            setQrCode(value);
            await claimCode(value);
            return;
          }
        } catch {
          // keep scanning
        }
        requestAnimationFrame(() => {
          void tick();
        });
      };
      void tick();
    } catch {
      setScanning(false);
      setQrMsg(
        ar
          ? "تعذّر الوصول للكاميرا — أدخلي الرمز يدوياً."
          : "Camera permission denied — enter the code manually.",
      );
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  if (loading) {
    return (
      <div className="vl-rewards" dir={ar ? "rtl" : "ltr"}>
        <p className="vl-rewards__muted">
          {ar ? "جارٍ تحميل مكافآتكِ…" : "Loading your rewards…"}
        </p>
      </div>
    );
  }

  if (error || !data?.balance) {
    return (
      <div className="vl-rewards" dir={ar ? "rtl" : "ltr"}>
        <p className="vl-rewards__error">{error}</p>
        <Link href="/account" className="vl-rewards__back">
          {ar ? "العودة للحساب" : "Back to account"}
        </Link>
      </div>
    );
  }

  const ways = data.config?.waysToEarn ?? [];
  const activity = data.activity ?? [];

  return (
    <div className="vl-rewards" dir={ar ? "rtl" : "ltr"}>
      <div className="vl-rewards__header">
        <Link href="/account" className="vl-rewards__back">
          {ar ? "→ الحساب" : "← Account"}
        </Link>
        <h1 className="vl-rewards__h1">
          {ar ? "مكافآت Velora" : "Velora Rewards"}
        </h1>
      </div>

      <LoyaltyMembershipCard
        available={data.balance.available}
        ar={ar}
        href="/account/rewards"
        className="vl-rewards__card"
      />

      <p className="vl-rewards__meta">
        {ar ? "إجمالي مكتسب" : "Lifetime earned"}:{" "}
        <strong dir="ltr">
          {data.balance.lifetimeEarned.toLocaleString(ar ? "ar-IQ" : "en-US")}
        </strong>
      </p>

      <section className="vl-rewards__section">
        <h2>{ar ? "طرق كسب النقاط" : "Ways to earn"}</h2>
        <ul className="vl-rewards__earn">
          {ways.map((w) => (
            <li key={w.id}>
              <span className="vl-rewards__earn-title">
                {ar ? w.titleAr : w.titleEn}
              </span>
              <span className="vl-rewards__earn-detail">
                {ar ? w.detailAr : w.detailEn}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="vl-rewards__section">
        <h2>{ar ? "ادعُ أصدقاءك إلى Velora" : "Invite friends to Velora"}</h2>
        <p className="vl-rewards__muted">
          {ar
            ? `الأصدقاء الذين انضموا عن طريقك: ${data.referral?.successfulCount ?? 0}`
            : `Friends who joined via you: ${data.referral?.successfulCount ?? 0}`}
        </p>
        <div className="vl-rewards__ref-box" dir="ltr">
          {data.referral?.url}
        </div>
        <div className="vl-rewards__actions">
          <button type="button" onClick={() => void onCopy()}>
            {ar ? "نسخ الرابط" : "Copy link"}
          </button>
          <button type="button" onClick={() => void onWhatsApp()}>
            {ar ? "مشاركة عبر WhatsApp" : "Share on WhatsApp"}
          </button>
          <button type="button" onClick={() => void onNativeShare()}>
            {ar ? "مشاركة" : "Share"}
          </button>
        </div>
        {shareMsg ? <p className="vl-rewards__hint">{shareMsg}</p> : null}
        <p className="vl-rewards__hint">
          {ar
            ? `حد المشاركة المكافأة: ${LOYALTY_CONFIG.shareReferral.dailyLimit}/يوم · ${LOYALTY_CONFIG.shareReferral.monthlyLimit}/شهر`
            : `Rewarded shares: ${LOYALTY_CONFIG.shareReferral.dailyLimit}/day · ${LOYALTY_CONFIG.shareReferral.monthlyLimit}/month`}
        </p>
      </section>

      <section className="vl-rewards__section">
        <h2>{ar ? "مسح رمز Velora" : "Scan Velora code"}</h2>
        <div className="vl-rewards__qr-entry">
          <button
            type="button"
            className="vl-rewards__qr-btn"
            onClick={() => (scanning ? stopScan() : void startScan())}
          >
            <span className="vl-rewards__qr-icon" aria-hidden>
              ▦
            </span>
            {scanning
              ? ar
                ? "إيقاف الماسح"
                : "Stop scanner"
              : ar
                ? "فتح الماسح"
                : "Open scanner"}
          </button>
          {scanning ? (
            <video
              ref={videoRef}
              className="vl-rewards__video"
              muted
              playsInline
            />
          ) : null}
          <form onSubmit={onClaimQr} className="vl-rewards__qr-form">
            <input
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder={ar ? "أو أدخلي الرمز يدوياً" : "Or enter code manually"}
              autoComplete="off"
            />
            <button type="submit" disabled={qrBusy || !qrCode.trim()}>
              {qrBusy ? "…" : ar ? "مطالبة" : "Claim"}
            </button>
          </form>
          {qrMsg ? <p className="vl-rewards__hint">{qrMsg}</p> : null}
        </div>
      </section>

      <section className="vl-rewards__section">
        <h2>{ar ? "النشاط الأخير" : "Recent activity"}</h2>
        {activity.length === 0 ? (
          <p className="vl-rewards__muted">
            {ar ? "لا يوجد نشاط بعد." : "No activity yet."}
          </p>
        ) : (
          <ul className="vl-rewards__activity">
            {activity.map((row) => (
              <li key={row.id}>
                <div>
                  <p>{ar ? row.labelAr : row.labelEn}</p>
                  <time dateTime={row.createdAt}>
                    {new Date(row.createdAt).toLocaleDateString(
                      ar ? "ar-IQ" : "en-US",
                    )}
                  </time>
                </div>
                <span
                  className={
                    row.points >= 0
                      ? "vl-rewards__pts-pos"
                      : "vl-rewards__pts-neg"
                  }
                  dir="ltr"
                >
                  {row.points > 0 ? "+" : ""}
                  {row.points} {ar ? "نقطة" : "pts"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
