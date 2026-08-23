"use client";

import { useEffect, useRef, useState } from "react";
import type { StoredOrder } from "@/lib/order-types";
import { downloadReceiptPng } from "@/lib/receipt-image";
import {
  buildWhatsAppUrl,
  getOrderReceiptPath,
} from "@/lib/whatsapp-receipt";

type Props = {
  order: StoredOrder;
  compact?: boolean;
  onSent?: () => void;
  /** في صفحة الوصل: حمّل صورة الوصل وافتح واتساب */
  autoOpenWhatsApp?: boolean;
};

async function tryNativeShare(dataUrl: string, order: StoredOrder) {
  try {
    if (!navigator.share || !navigator.canShare) return false;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `VELORA-Receipt-${order.orderId}.png`, {
      type: "image/png",
    });
    const { buildWhatsAppReceiptMessage } = await import("@/lib/whatsapp-receipt");
    const payload = {
      files: [file],
      title: "VELORA Receipt",
      text: buildWhatsAppReceiptMessage(order),
    };
    if (!navigator.canShare(payload)) return false;
    await navigator.share(payload);
    return true;
  } catch {
    return false;
  }
}

export function WhatsAppReceiptActions({
  order,
  compact,
  onSent,
  autoOpenWhatsApp = false,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const autoStarted = useRef(false);

  async function markSent() {
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          status: order.status === "new" ? "preparing" : order.status,
          markReceiptSent: true,
        }),
      });
    } catch {
      /* غير حرج */
    }
    onSent?.();
  }

  function openWhatsAppDirect() {
    const url = buildWhatsAppUrl(order, true);
    if (!url) {
      setError("رقم الهاتف غير صالح لإرسال واتساب.");
      return false;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    void markSent();
    setHint("تم فتح واتساب مع رسالة جاهزة تتضمن رقم التتبع.");
    return true;
  }

  async function captureImageAndOpenWhatsApp() {
    setSending(true);
    setError(null);
    setHint(null);
    try {
      const dataUrl = await downloadReceiptPng(order.orderId);
      const shared = await tryNativeShare(dataUrl, order);
      if (shared) {
        void markSent();
        setHint("اختاري واتساب من قائمة المشاركة لإرسال صورة الوصل.");
      } else {
        setHint(
          "تم تنزيل صورة الوصل. سيتم فتح واتساب مع رسالة التتبع — أرفقي الصورة من المعرض.",
        );
        await new Promise((r) => setTimeout(r, 350));
        openWhatsAppDirect();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تعذّر إنشاء صورة الوصل.",
      );
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!autoOpenWhatsApp || autoStarted.current) return;
    autoStarted.current = true;
    const t = window.setTimeout(() => {
      void captureImageAndOpenWhatsApp();
    }, 900);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenWhatsApp]);

  function printReceipt() {
    window.print();
  }

  const statusLine = hint ? (
    <p className="t2 w-full text-[var(--plum)]">{hint}</p>
  ) : null;
  const errorLine = error ? (
    <p className="t2 w-full text-red-700">{error}</p>
  ) : null;

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openWhatsAppDirect}
            disabled={sending}
            className="t2 rounded-[10px] bg-[#25D366] px-3 py-2 font-medium text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            واتساب مباشر — تتبع
          </button>
          <button
            type="button"
            onClick={() => void captureImageAndOpenWhatsApp()}
            disabled={sending}
            className="t2 rounded-[10px] border border-[#25D366]/40 bg-white px-3 py-2 text-[#1a7a42] disabled:opacity-60"
          >
            {sending ? "جارٍ تجهيز الوصل…" : "واتساب + صورة الوصل"}
          </button>
          <a
            href={getOrderReceiptPath(order.orderId)}
            target="_blank"
            rel="noreferrer"
            className="t2 border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 text-[var(--plum)]"
          >
            فتح الوصل
          </a>
        </div>
        {errorLine}
        {statusLine}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 print:hidden">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openWhatsAppDirect}
          disabled={sending}
          className="t2 inline-flex items-center gap-2 rounded-[12px] bg-[#25D366] px-4 py-2.5 font-medium text-white shadow-[0_4px_14px_-4px_rgba(37,211,102,0.55)] transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          <WhatsAppIcon />
          إرسال واتساب مباشر — رقم التتبع
        </button>
        <button
          type="button"
          onClick={() => void captureImageAndOpenWhatsApp()}
          disabled={sending}
          className="t2 inline-flex items-center gap-2 rounded-[12px] border border-[#25D366]/35 bg-white px-4 py-2.5 text-[#1a7a42] disabled:opacity-60"
        >
          {sending ? "جارٍ تجهيز الصورة…" : "واتساب + صورة الوصل"}
        </button>
        <button
          type="button"
          onClick={printReceipt}
          className="t2 rounded-[12px] border border-[var(--plum)] bg-[var(--plum)] px-4 py-2.5 text-[var(--ivory)]"
        >
          طباعة الوصل
        </button>
      </div>
      {errorLine}
      {statusLine}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 14.9L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.3 14.3c-.2.6-1 1-1.6 1.1-.4.1-.9.1-1.4-.1-.3-.1-.7-.3-1.3-.5-2.3-1-3.8-3.3-3.9-3.5-.1-.2-.9-1.2-.9-2.3s.6-1.7.8-1.9c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .5.4.2.4.6 1.5.7 1.6.1.1.1.3 0 .4-.1.2-.2.3-.3.5-.1.1-.2.2-.1.4.1.2.4.7 1 1.1.7.6 1.3.8 1.5.9.2.1.3 0 .4-.1l.6-.7c.2-.2.3-.2.6-.1.3.1 1.2.6 1.4.7.2.1.4.2.4.3 0 .2 0 .6-.2 1Z" />
    </svg>
  );
}
