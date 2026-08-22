import { cn } from "@/lib/utils";

const steps = [
  { id: "details", label: "البيانات", num: "01" },
  { id: "payment", label: "الدفع", num: "02" },
  { id: "review", label: "المراجعة", num: "03" },
] as const;

export function CheckoutProgress({
  active = "payment",
}: {
  active?: (typeof steps)[number]["id"];
}) {
  const activeIndex = steps.findIndex((s) => s.id === active);

  return (
    <nav aria-label="مراحل إتمام الطلب" className="mt-8">
      <ol className="flex items-center gap-0">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:gap-3">
                <span
                  className={cn(
                    "font-display text-[0.65rem] tracking-[0.2em] transition-colors duration-200 sm:text-[0.7rem]",
                    isActive
                      ? "text-[var(--plum)]"
                      : isComplete
                        ? "text-[var(--plum)]/55"
                        : "text-[var(--muted)]/70",
                  )}
                >
                  {step.num}
                </span>
                <span
                  className={cn(
                    "t2 truncate transition-colors duration-200",
                    isActive
                      ? "font-medium text-[var(--plum)]"
                      : isComplete
                        ? "text-[var(--plum)]/60"
                        : "text-[var(--muted)]",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className="mx-3 hidden h-px flex-1 sm:block"
                  aria-hidden
                >
                  <div
                    className={cn(
                      "h-full w-full transition-colors duration-200",
                      index < activeIndex
                        ? "bg-[var(--plum)]/35"
                        : "bg-[var(--plum)]/10",
                    )}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
