import {
  ORDER_STATUS_LABELS,
  ORDER_TIMELINE,
  orderTimelineProgress,
  type OrderStatus,
} from "@/lib/order-types";
import { Check } from "@/components/admin/ui/icons";

export function OrderTimeline({
  status,
  savedAt,
  updatedAt,
  compact = false,
}: {
  status: OrderStatus;
  savedAt: string;
  updatedAt?: string;
  compact?: boolean;
}) {
  const current = orderTimelineProgress(status);
  const isTerminal =
    status === "cancelled" ||
    status === "returned" ||
    status === "failed_delivery" ||
    status === "deferred";

  if (isTerminal) {
    return (
      <div className="rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-4 py-3">
        <p className="text-[13px] font-medium text-[var(--admin-text)]">
          {ORDER_STATUS_LABELS[status]}
        </p>
        <p className="mt-1 text-[12px] text-[var(--admin-text-muted)]" dir="ltr">
          {new Date(updatedAt || savedAt).toLocaleString("ar-IQ")}
        </p>
      </div>
    );
  }

  const steps = compact
    ? ORDER_TIMELINE.filter((_, i) => i === 0 || i === current || i === ORDER_TIMELINE.length - 1 || Math.abs(i - current) <= 1)
    : ORDER_TIMELINE;

  return (
    <ol className="relative space-y-0">
      {ORDER_TIMELINE.map((step, index) => {
        if (compact && !steps.includes(step)) return null;
        const done = current >= 0 && index < current;
        const active = current === index;
        const upcoming = current < 0 || index > current;

        return (
          <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
            {index < ORDER_TIMELINE.length - 1 ? (
              <span
                className={`absolute end-[11px] top-6 bottom-0 w-px ${
                  done
                    ? "bg-[var(--admin-success)]/40"
                    : "bg-[var(--admin-border-strong)]"
                }`}
                aria-hidden
              />
            ) : null}
            <div className="min-w-0 flex-1 text-right">
              <p
                className={`text-[13px] ${
                  active
                    ? "font-semibold text-[var(--admin-text)]"
                    : done
                      ? "font-medium text-[var(--admin-text)]"
                      : "text-[var(--admin-text-muted)]"
                }`}
              >
                {ORDER_STATUS_LABELS[step]}
              </p>
              {active || (done && index === 0) ? (
                <p
                  className="mt-0.5 text-[11px] text-[var(--admin-text-muted)]"
                  dir="ltr"
                >
                  {index === 0
                    ? new Date(savedAt).toLocaleString("ar-IQ", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : updatedAt
                      ? new Date(updatedAt).toLocaleString("ar-IQ", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                </p>
              ) : null}
              {active ? (
                <p className="mt-0.5 text-[11px] text-[var(--admin-text-secondary)]">
                  بواسطة النظام
                </p>
              ) : null}
            </div>
            <span
              className={`relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full border ${
                done
                  ? "border-[var(--admin-success)] bg-[var(--admin-success)] text-white"
                  : active
                    ? "border-[var(--admin-plum)] bg-[var(--admin-plum)] text-white"
                    : "border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-transparent"
              }`}
            >
              {done || active ? (
                <Check className="size-3" strokeWidth={2.5} />
              ) : (
                <span className="size-1.5 rounded-full bg-[var(--admin-border-strong)]" />
              )}
              <span className="sr-only">
                {done ? "مكتمل" : active ? "حالي" : "قادم"}
              </span>
            </span>
            {upcoming ? null : null}
          </li>
        );
      })}
    </ol>
  );
}
