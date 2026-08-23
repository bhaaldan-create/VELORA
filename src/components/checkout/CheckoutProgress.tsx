"use client";

import { cn } from "@/lib/utils";
import {
  IconCheck,
  IconCreditCard,
  IconFileCheck,
  IconHome,
} from "@/components/checkout/CheckoutIcons";

const steps = [
  {
    id: "details" as const,
    label: "البيانات",
    num: "01",
    Icon: IconHome,
  },
  {
    id: "payment" as const,
    label: "الدفع",
    num: "02",
    Icon: IconCreditCard,
  },
  {
    id: "review" as const,
    label: "المراجعة",
    num: "03",
    Icon: IconFileCheck,
  },
];

export type CheckoutProgressStep = (typeof steps)[number]["id"];

export function CheckoutProgress({
  active = "details",
}: {
  active?: CheckoutProgressStep;
}) {
  const activeIndex = steps.findIndex((s) => s.id === active);

  return (
    <nav aria-label="مراحل إتمام الطلب" className="mt-6 sm:mt-8">
      <ol className="flex items-start justify-between gap-1">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          const isUpcoming = index > activeIndex;
          const StepIcon = step.Icon;

          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <div
                    className="mx-1 h-px flex-1 sm:mx-2"
                    aria-hidden
                  >
                    <div
                      className={cn(
                        "h-full w-full origin-right transition-all duration-300 ease-out",
                        index <= activeIndex
                          ? "bg-[var(--plum)]/40 scale-x-100"
                          : "bg-[var(--plum)]/10 scale-x-100",
                      )}
                      style={{
                        transitionDelay: isActive ? "80ms" : "0ms",
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-1" aria-hidden />
                )}

                <div
                  className={cn(
                    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-out sm:h-12 sm:w-12",
                    isActive
                      ? "border-[var(--plum)]/35 bg-[var(--plum)]/[0.06] text-[var(--plum)] shadow-[0_0_0_4px_rgba(61,38,64,0.06)]"
                      : isComplete
                        ? "border-[var(--plum)]/25 bg-[var(--plum)] text-[var(--ivory)]"
                        : "border-[var(--plum)]/12 bg-[var(--surface)] text-[var(--muted)]",
                  )}
                >
                  {isComplete ? (
                    <IconCheck className="h-4 w-4" />
                  ) : (
                    <StepIcon
                      className={cn(
                        "h-[1.15rem] w-[1.15rem] transition-opacity duration-300",
                        isUpcoming && "opacity-55",
                      )}
                    />
                  )}
                  {isActive ? (
                    <span
                      className="absolute inset-0 rounded-full motion-safe:animate-[velora-fade_2s_ease-in-out_infinite] border border-[var(--plum)]/15"
                      aria-hidden
                    />
                  ) : null}
                </div>

                {index < steps.length - 1 ? (
                  <div
                    className="mx-1 h-px flex-1 sm:mx-2"
                    aria-hidden
                  >
                    <div
                      className={cn(
                        "h-full w-full origin-left transition-all duration-300 ease-out",
                        index < activeIndex
                          ? "bg-[var(--plum)]/40"
                          : "bg-[var(--plum)]/10",
                      )}
                    />
                  </div>
                ) : (
                  <div className="flex-1" aria-hidden />
                )}
              </div>

              <div className="mt-2.5 flex flex-col items-center gap-0.5 text-center">
                <span
                  className={cn(
                    "font-display text-[0.6rem] tracking-[0.18em] transition-colors duration-300 sm:text-[0.65rem]",
                    isActive
                      ? "text-[var(--plum)]"
                      : isComplete
                        ? "text-[var(--plum)]/55"
                        : "text-[var(--muted)]/65",
                  )}
                >
                  {step.num}
                </span>
                <span
                  className={cn(
                    "t2 transition-colors duration-300",
                    isActive
                      ? "font-semibold text-[var(--plum)]"
                      : isComplete
                        ? "font-medium text-[var(--plum)]/65"
                        : "text-[var(--muted)]",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
