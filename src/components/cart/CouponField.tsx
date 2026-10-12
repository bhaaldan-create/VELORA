"use client";

import { formatPrice } from "@/lib/utils";

type Props = {
  id?: string;
  code: string;
  applied: string;
  error: string | null;
  loading: boolean;
  discountPercent?: number | null;
  discountIqd?: number;
  onChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
};

export function CouponField({
  id = "coupon-code",
  code,
  applied,
  error,
  loading,
  discountPercent,
  discountIqd = 0,
  onChange,
  onApply,
  onClear,
}: Props) {
  const confirmed =
    applied && !error && (!loading || Boolean(discountPercent) || discountIqd > 0);
  if (confirmed) {
    const detail = discountPercent
      ? `خصم ${discountPercent}%`
      : discountIqd > 0
        ? ""
        : loading
          ? "…"
          : "شحن مجاني";
    return (
      <div className="flex items-center gap-3 rounded-[16px] border border-[#1f7a4d]/28 bg-[#f4fbf7] p-4">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1f7a4d] text-white"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.5 12.5 l4 4 l9-9.5" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[1.05rem] font-semibold leading-tight tracking-normal text-[#1f5c3d]">
            تم تطبيق الخصم
          </p>
          {detail ? (
            <p className="mt-1 text-[0.92rem] font-semibold text-[#2f6b4f]">{detail}</p>
          ) : null}
          {discountIqd > 0 ? (
            <p className="mt-0.5 font-price text-[12px] text-[#1f7a4d]/80">
              -{formatPrice(discountIqd)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="ms-auto self-center text-[12px] text-[var(--muted)] underline"
        >
          إزالة
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--plum)]/10 bg-[var(--surface)] p-4">
      <label htmlFor={id} className="t3 font-medium text-[var(--plum)]">
        كود الخصم
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id={id}
          value={code}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onApply();
            }
          }}
          placeholder="VELORA10"
          className="h-11 min-w-0 flex-1 rounded-[12px] border border-[var(--plum)]/12 bg-white px-3 text-[14px] uppercase tracking-wide text-[var(--ink)] outline-none focus:border-[var(--plum)]/40"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={loading || !code.trim()}
          className="h-11 shrink-0 rounded-[12px] bg-[var(--plum)] px-4 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {loading ? "..." : "تطبيق"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-[var(--plum)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
