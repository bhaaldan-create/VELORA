"use client";

type Props = {
  id?: string;
  code: string;
  applied: string;
  error: string | null;
  loading: boolean;
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
  onChange,
  onApply,
  onClear,
}: Props) {
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
      {applied && !error ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 text-[12px] text-[var(--muted)] underline"
        >
          إزالة الكود
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-[var(--plum)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
