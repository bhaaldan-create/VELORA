"use client";

import { useEffect, useRef, useState } from "react";
import { LarsaAvatar } from "@/components/advisor/LarsaAvatar";
import { LarsaMark } from "@/components/advisor/LarsaIcons";
import { cn } from "@/lib/utils";

const STEPS = [
  "أراجع احتياجاتكِ",
  "أطابقها مع المنتجات المتوفرة",
  "أرتب لكِ أفضل الخيارات",
];

export function LarsaAnalyzing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [line, setLine] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
    const t1 = window.setTimeout(() => setLine(1), 900);
    const t2 = window.setTimeout(() => setStep(1), 1600);
    const t3 = window.setTimeout(() => setStep(2), 2600);
    const t4 = window.setTimeout(() => setStep(3), 3600);
    const t5 = window.setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      onDoneRef.current();
    }, 4400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.clearTimeout(t5);
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-x-hidden bg-[var(--larsa-white)] px-5 py-16"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 45% 40% at 50% 40%, rgba(243,237,245,0.95), transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-md text-center">
        <div className="flex justify-center">
          <LarsaAvatar size="lg" thinking />
        </div>

        <div className="mt-8 flex justify-center">
          <LarsaMark size={36} spinning />
        </div>

        <p className="mt-6 text-[1.25rem] font-semibold text-[var(--larsa-plum)]">
          {line === 0 ? "فهمتكِ." : "خليني أرتب لكِ روتين يناسب احتياجاتكِ."}
        </p>
        <p className="mt-3 text-[0.9rem] text-[var(--larsa-plum-soft)]">
          خليني أشوف شنو الأنسب لكِ…
        </p>

        <ul className="mt-10 space-y-3 text-start">
          {STEPS.map((label, i) => {
            const done = step > i;
            const active = step === i;
            return (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-3 rounded-[16px] border px-4 py-3 text-[0.9rem] transition-colors duration-300",
                  done || active
                    ? "border-[var(--larsa-border-strong)] bg-[var(--larsa-lavender)] text-[var(--larsa-plum)]"
                    : "border-[var(--larsa-border)] text-[var(--larsa-muted)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-latin",
                    done
                      ? "border-[var(--larsa-plum)] bg-[var(--larsa-plum)] text-white"
                      : "border-[var(--larsa-lavender-deep)]",
                  )}
                >
                  {done ? "✓" : String(i + 1).padStart(2, "0")}
                </span>
                {label}
              </li>
            );
          })}
        </ul>

        {step >= 3 ? (
          <p className="mt-8 text-[1rem] font-medium text-[var(--larsa-plum)]">
            وجدت لكِ شيئاً مميزاً.
          </p>
        ) : null}
      </div>
    </div>
  );
}
