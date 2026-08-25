"use client";

import { useEffect, useId, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { SUPER_QI_ACCOUNT } from "@/lib/super-qi";
import type { PaymentMethodId } from "@/data/payments";
import { getPaymentMethod } from "@/data/payments";
import { PaymentLogo } from "@/components/payments/PaymentMethods";

type Props = {
  open: boolean;
  onClose: () => void;
  paymentMethod: PaymentMethodId;
  amountIqd: number;
  customerName?: string;
  disabled?: boolean;
  onConfirm: (data: { transferReference: string }) => void;
};

export function SuperQiPaymentModal({
  open,
  onClose,
  paymentMethod,
  amountIqd,
  customerName,
  disabled,
  onConfirm,
}: Props) {
  const titleId = useId();
  const [copied, setCopied] = useState(false);
  const [transferReference, setTransferReference] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const method = getPaymentMethod(paymentMethod);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setTransferReference("");
      setLocalError(null);
      setCopied(false);
    }
  }, [open, paymentMethod]);

  if (!open) return null;

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(SUPER_QI_ACCOUNT.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setLocalError("تعذّر النسخ — انسخي الرقم يدوياً.");
    }
  }

  function confirm() {
    const ref = transferReference.trim();
    if (ref.length < 4) {
      setLocalError("أدخلي رقم عملية التحويل من تطبيق سوبر كي (4 أحرف على الأقل).");
      return;
    }
    setLocalError(null);
    onConfirm({ transferReference: ref });
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--ink)]/45 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] animate-[velora-rise_0.35s_ease-out_both]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-[var(--btn-bg)] px-5 py-6 text-[var(--btn-fg)] sm:px-7">
          <div className="pointer-events-none absolute -end-8 -top-10 h-40 w-40 rounded-full bg-[var(--champagne)]/20" />
          <div className="pointer-events-none absolute -start-6 bottom-0 h-28 w-28 rounded-full bg-[var(--blush)]/25" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="t1 tracking-[0.2em] text-[var(--btn-fg)]/70">
                {SUPER_QI_ACCOUNT.providerEn}
              </p>
              <h2 id={titleId} className="font-display t6 mt-2 font-semibold">
                تحويل إلى سوبر كي
              </h2>
              <p className="t3 mt-2 text-[var(--btn-fg)]/80">
                ادفعي عبر {method?.nameAr ?? "البطاقة"} إلى حساب الشركة مباشرة
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="t2 border border-[var(--btn-fg)]/25 px-3 py-1.5 text-[var(--btn-fg)] hover:bg-[var(--btn-fg)]/10"
              aria-label="إغلاق"
            >
              إغلاق
            </button>
          </div>
          {method ? (
            <div className="relative mt-5 inline-flex bg-[var(--bg-elevated)] p-2">
              <PaymentLogo method={method} compact />
            </div>
          ) : null}
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-7">
          <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="t2 text-[var(--muted)]">المبلغ المطلوب تحويله</p>
            <p className="font-price t6 mt-1 font-semibold text-[var(--plum)]">
              {formatPrice(amountIqd)}
            </p>
            {customerName ? (
              <p className="t2 mt-2 text-[var(--muted)]">
                باسم: {customerName}
              </p>
            ) : null}
          </div>

          <div className="border border-[var(--border)] bg-[var(--mist)] p-4">
            <p className="t2 text-[var(--muted)]">رقم حساب الشركة — سوبر كي</p>
            <p
              className="font-display t5 mt-2 font-semibold tracking-[0.08em] text-[var(--plum)]"
              dir="ltr"
            >
              {SUPER_QI_ACCOUNT.number}
            </p>
            <p className="t2 mt-1 text-[var(--muted)]">
              {SUPER_QI_ACCOUNT.nameAr}
            </p>
            <button
              type="button"
              onClick={() => void copyAccount()}
              className="t2 mt-4 border border-[var(--btn-bg)] bg-[var(--btn-bg)] px-4 py-2 text-[var(--btn-fg)]"
            >
              {copied ? "تم نسخ الرقم ✓" : "نسخ رقم الحساب"}
            </button>
          </div>

          <ol className="space-y-3">
            {[
              "افتحي تطبيق سوبر كي (أو كي كارد).",
              "اختاري تحويل / دفع إلى رقم حساب.",
              `الصقي رقم الحساب ${SUPER_QI_ACCOUNT.number} وحوّلي المبلغ أعلاه بالكامل.`,
              "إن كان لديكِ فيزا أو ماستركارد مربوطة بالتطبيق، يمكنكِ الدفع منها إلى هذا الحساب.",
              "بعد نجاح التحويل، انسخي رقم العملية وأدخليه بالأسفل ثم أكّدي.",
            ].map((step, i) => (
              <li key={step} className="t3 flex gap-3 text-[var(--ink)]/75">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--btn-bg)] text-[var(--btn-fg)] t2">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <label className="block">
            <span className="t2 text-[var(--muted)]">
              رقم عملية التحويل من سوبر كي
            </span>
            <input
              value={transferReference}
              onChange={(e) => setTransferReference(e.target.value)}
              disabled={disabled}
              dir="ltr"
              placeholder="مثال: 84920133"
              className="t3 mt-2 w-full border border-[var(--border)] bg-[var(--bg-input)] px-3 py-3 text-[var(--ink)] outline-none focus:border-[var(--plum)] disabled:opacity-50"
            />
          </label>

          {localError ? (
            <p className="t3 border border-red-200 bg-red-50 px-3 py-2 text-red-800">
              {localError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              disabled={disabled}
              onClick={confirm}
              className="t3 flex-1 border border-[var(--btn-bg)] bg-[var(--btn-bg)] px-4 py-3 text-[var(--btn-fg)] disabled:opacity-40"
            >
              {disabled ? "جارٍ التأكيد…" : "تم التحويل — أكّدي الطلب"}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={onClose}
              className="t3 border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--plum)] disabled:opacity-40"
            >
              رجوع
            </button>
          </div>

          <p className="t2 text-[var(--muted)]">
            بعد التأكيد يصل الطلب لفريق VELORA مع رقم التحويل للتحقق من وصول
            المبلغ إلى حساب سوبر كي.
          </p>
        </div>
      </div>
    </div>
  );
}
