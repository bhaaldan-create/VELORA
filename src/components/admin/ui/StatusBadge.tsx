import type { ReactNode } from "react";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SHORT,
  ORDER_STATUS_TONE,
  type OrderStatus,
} from "@/lib/order-types";
import { TONE_BADGE } from "@/components/admin/ui/icons";

export function StatusBadge({
  status,
  short = false,
  className = "",
}: {
  status: OrderStatus;
  short?: boolean;
  className?: string;
}) {
  const tone = ORDER_STATUS_TONE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${TONE_BADGE[tone]} ${className}`}
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-current opacity-70"
        aria-hidden
      />
      {short ? ORDER_STATUS_SHORT[status] : ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof TONE_BADGE;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TONE_BADGE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
