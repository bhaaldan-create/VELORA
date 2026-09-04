"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormSection({
  title,
  subtitle,
  icon: Icon,
  children,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[20px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--admin-shadow)] sm:p-6",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--admin-surface-soft)] text-[var(--admin-plum)]">
              <Icon className="size-4" strokeWidth={1.6} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--admin-text)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-[12.5px] leading-5 text-[var(--admin-text-muted)]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FormField({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="block">
      {label ? (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-[12px] font-medium text-[var(--admin-text-secondary)]"
        >
          {label}
        </label>
      ) : null}
      {children}
      {hint ? (
        <p className="mt-1.5 text-[11.5px] leading-4 text-[var(--admin-text-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-[12px] text-[var(--admin-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const modernInputClass =
  "h-11 w-full rounded-[13px] border border-[var(--admin-border)] bg-white px-3.5 text-[14px] text-[var(--admin-text)] outline-none transition duration-200 placeholder:text-[var(--admin-text-muted)] focus:border-[var(--admin-plum-soft)] focus:ring-[3px] focus:ring-[var(--admin-plum)]/8 disabled:cursor-not-allowed disabled:opacity-50";

export const modernTextareaClass =
  "w-full resize-y rounded-[14px] border border-[var(--admin-border)] bg-white px-3.5 py-3 text-[14px] leading-7 text-[var(--admin-text)] outline-none transition duration-200 placeholder:text-[var(--admin-text-muted)] focus:border-[var(--admin-plum-soft)] focus:ring-[3px] focus:ring-[var(--admin-plum)]/8";

export function ProgressMeter({
  label,
  completed,
  total,
}: {
  label: string;
  completed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="rounded-[16px] border border-[var(--admin-border)] bg-white/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 text-[12.5px]">
        <span className="font-medium text-[var(--admin-text)]">{label}</span>
        <span className="tabular-nums text-[var(--admin-text-muted)]">
          {completed} من {total} · {pct}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--admin-surface-soft)]">
        <div
          className="h-full rounded-full bg-[var(--admin-plum)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StickyFormActions({
  left,
  right,
  note,
}: {
  left?: ReactNode;
  right: ReactNode;
  note?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 border-t border-[var(--admin-border)] bg-white/95 shadow-[0_-8px_30px_rgba(44,35,48,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/88 lg:bottom-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0">
          {note ? (
            <p className="text-[12.5px] text-[var(--admin-text-secondary)]">
              {note}
            </p>
          ) : null}
          {left}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {right}
        </div>
      </div>
    </div>
  );
}

export function PreviewCard({
  imageUrl,
  titleAr,
  titleEn,
  brand,
  category,
  priceLabel,
  stock,
  published,
}: {
  imageUrl?: string | null;
  titleAr: string;
  titleEn: string;
  brand?: string;
  category: string;
  priceLabel: string;
  stock: string | number;
  published: boolean;
}) {
  return (
    <aside className="rounded-[20px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--admin-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]">
        معاينة المنتج
      </p>
      <div className="mt-4 overflow-hidden rounded-[16px] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)]">
        <div className="aspect-[4/5] bg-[linear-gradient(160deg,#f7f2f4_0%,#eee7ea_55%,#e4d8dc_100%)]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={titleAr || titleEn || "preview"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[12.5px] text-[var(--admin-text-muted)]">
              ستظهر صورة المنتج هنا
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <h3 className="text-[15px] font-semibold leading-snug text-[var(--admin-text)]">
          {titleAr || "اسم المنتج بالعربية"}
        </h3>
        <p className="text-[12.5px] text-[var(--admin-text-secondary)]" dir="ltr">
          {titleEn || "English product name"}
        </p>
        {(brand || category) && (
          <p className="text-[12px] text-[var(--admin-text-muted)]">
            {[brand, category].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-[var(--admin-border)] pt-4">
        <div>
          <p className="text-[11px] text-[var(--admin-text-muted)]">السعر</p>
          <p className="mt-0.5 text-[16px] font-semibold text-[var(--admin-plum)]">
            {priceLabel}
          </p>
        </div>
        <div className="text-end">
          <p className="text-[11px] text-[var(--admin-text-muted)]">المخزون</p>
          <p className="mt-0.5 text-[13px] font-medium text-[var(--admin-text)]">
            {stock}
          </p>
        </div>
      </div>
      <div
        className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${
          published
            ? "bg-[var(--admin-success-bg)] text-[var(--admin-success)]"
            : "bg-[var(--admin-surface-mute)] text-[var(--admin-text-muted)]"
        }`}
      >
        <span
          className={`size-1.5 rounded-full ${
            published ? "bg-[var(--admin-success)]" : "bg-[var(--admin-text-muted)]"
          }`}
        />
        {published ? "جاهز للنشر" : "مسودة / مخفي"}
      </div>
    </aside>
  );
}
