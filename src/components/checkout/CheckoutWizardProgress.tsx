"use client";

import { cn } from "@/lib/utils";
import { IconCheck } from "@/components/checkout/CheckoutIcons";
import type { CheckoutProgressStep } from "@/components/checkout/CheckoutProgress";
import "./checkout-wizard.css";

const steps = [
  { id: "details" as const, label: "البيانات", num: "01" },
  { id: "payment" as const, label: "الدفع", num: "02" },
  { id: "review" as const, label: "المراجعة", num: "03" },
];

/**
 * Progress for DATA + PAYMENT + REVIEW.
 * Do not use on Success / Countdown / Processing.
 */
export function CheckoutWizardProgress({
  active = "details",
}: {
  active?: CheckoutProgressStep;
}) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === active),
  );

  return (
    <nav
      aria-label="مراحل إتمام الطلب"
      className="checkout-wizard mt-6 sm:mt-7"
    >
      <ol className="cw-progress">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          return (
            <li
              key={step.id}
              className="cw-progress__item"
              aria-current={isActive ? "step" : undefined}
            >
              {index > 0 ? (
                <span
                  className={cn(
                    "cw-progress__line",
                    index <= activeIndex && "is-on",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "cw-progress__dot",
                  isActive && "is-active",
                  isComplete && "is-done",
                )}
              >
                {isComplete ? (
                  <IconCheck className="h-3 w-3" />
                ) : (
                  <span className="cw-progress__num">{step.num}</span>
                )}
              </span>
              <span
                className={cn(
                  "cw-progress__label",
                  isActive && "is-active",
                  isComplete && "is-done",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
