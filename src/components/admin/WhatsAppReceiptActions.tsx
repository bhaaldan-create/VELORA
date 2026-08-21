"use client";

import { useEffect, useRef, useState } from "react";
import type { StoredOrder } from "@/lib/order-types";
import { downloadReceiptPng } from "@/lib/receipt-image";
import {
  buildWhatsAppReceiptMessage,
  buildWhatsAppUrl,
  getOrderReceiptPath,
} from "@/lib/whatsapp-receipt";

type Props = {
  order: StoredOrder;
  compact?: boolean;
  onSent?: () => void;
  /** في صفحة الوصل: حمّل صورة الوصل وافتح واتساب بالرسالة اللطيفة */
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
      // غير حرج
    }
    onSent?.();
  }

  function openWhatsAppChat() {
    const url = buildWhatsAppUrl(order);
    if (!url) {
      setError("رقم الهاتف غير صالح لإرسال واتساب.");
      return false;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    void markSent();
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
          "تم تنزيل صورة الوصل كاملة. في واتساب: ＋ ← صور والمستندات ← VELORA-Receipt",
        );
        await new Promise((r) => setTimeout(r, 400));
        openWhatsAppChat();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تعذّر إنشاء صورة الوصل.",
      );
    } finally {
      setSending(false);
    }
  }

  function sendFromAdminList() {
    window.open(
      `${getOrderReceiptPath(order.orderId)}?send=1`,
      "_blank",
      "noopener,noreferrer",
    );
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={sendFromAdminList}
          disabled={sending}
          className="t2 bg-[#25D366] px-3 py-2 text-white disabled:opacity-60"
        >
          واتساب — صورة الوصل
        </button>
        <a
          href={getOrderReceiptPath(order.orderId)}
          target="_blank"
          rel="noreferrer"
          className="t2 border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 text-[var(--plum)]"
        >
          فتح الوصل
        </a>
        {errorLine}
        {statusLine}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void captureImageAndOpenWhatsApp()}
          disabled={sending}
          className="t2 bg-[#25D366] px-4 py-2.5 text-white disabled:opacity-60"
        >
          {sending ? "جارٍ تجهيز الصورة الكاملة…" : "إرسال صورة الوصل عبر واتساب"}
        </button>
        <button
          type="button"
          onClick={printReceipt}
          className="t2 border border-[var(--plum)] bg-[var(--plum)] px-4 py-2.5 text-[var(--ivory)]"
        >
          طباعة الوصل
        </button>
      </div>
      {errorLine}
      {statusLine}
    </div>
  );
}
