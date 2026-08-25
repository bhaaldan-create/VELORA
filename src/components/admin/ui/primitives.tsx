import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  type LucideIcon,
} from "@/components/admin/ui/icons";
import { formatPrice } from "@/lib/utils";

export function StatCard({
  label,
  value,
  format = "number",
  deltaPct,
  icon: Icon,
  tone = "default",
  displayOverride,
  footnote,
}: {
  label: string;
  value: number;
  format?: "iqd" | "number";
  deltaPct?: number | null;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  /** When set, replaces the formatted number (e.g. «غير كافٍ») */
  displayOverride?: string;
  footnote?: string;
}) {
  const display =
    displayOverride ??
    (format === "iqd" ? formatPrice(value) : value.toLocaleString("ar-IQ"));

  const toneIcon =
    tone === "success"
      ? "text-[var(--admin-success)]"
      : tone === "warning"
        ? "text-[var(--admin-warning)]"
        : tone === "danger"
          ? "text-[var(--admin-danger)]"
          : tone === "info"
            ? "text-[var(--admin-info)]"
            : "text-[var(--admin-plum-soft)]";

  return (
    <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[var(--admin-shadow)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] leading-snug text-[var(--admin-text-secondary)]">
          {label}
        </p>
        {Icon ? (
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-surface-soft)] ${toneIcon}`}
          >
            <Icon className="size-3.5" strokeWidth={1.6} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="admin-num mt-2 text-[1.35rem] font-semibold tracking-tight text-[var(--admin-text)] sm:text-[1.5rem]">
        {display}
      </p>
      {deltaPct != null ? (
        <DeltaLine value={deltaPct} />
      ) : (
        <p className="mt-1.5 text-[11px] text-[var(--admin-text-muted)]">
          {footnote ?? "عن الفترة المحددة"}
        </p>
      )}
    </div>
  );
}

function DeltaLine({ value }: { value: number }) {
  const up = value > 0.05;
  const down = value < -0.05;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  const color = up
    ? "text-[var(--admin-success)]"
    : down
      ? "text-[var(--admin-danger)]"
      : "text-[var(--admin-text-muted)]";

  return (
    <p className={`mt-1.5 flex items-center gap-1 text-[11px] ${color}`}>
      <Icon className="size-3" strokeWidth={2} aria-hidden />
      <span className="admin-num">
        {up ? "+" : ""}
        {value.toFixed(1)}%
      </span>
      <span className="text-[var(--admin-text-muted)]">عن الأسبوع الماضي</span>
    </p>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--admin-radius)] border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-bg-elevated)] px-6 py-14 text-center">
      {Icon ? (
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[var(--admin-surface-soft)] text-[var(--admin-text-muted)]">
          <Icon className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
      ) : null}
      <p className="text-[15px] font-medium text-[var(--admin-text)]">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--admin-text-secondary)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.35rem] font-semibold tracking-tight text-[var(--admin-text)] sm:text-[1.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[13px] text-[var(--admin-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function Surface({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow)] ${padded ? "p-4 sm:p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const sizes =
    size === "sm" ? "h-8 px-3 text-[12px]" : "h-9 px-3.5 text-[13px]";
  const variants = {
    primary:
      "bg-[var(--admin-plum)] text-white hover:bg-[var(--admin-plum-mid)]",
    secondary:
      "border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-soft)]",
    ghost:
      "text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]",
    danger:
      "bg-[var(--admin-danger)] text-white hover:opacity-90",
  }[variant];

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-[var(--admin-radius-sm)] font-medium transition disabled:opacity-40 ${sizes} ${variants} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
