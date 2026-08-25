"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TOTAL_SECONDS = 5;
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatCountdownArabic(seconds: number): string {
  if (seconds === 1) return "ثانية واحدة";
  if (seconds === 2) return "ثانيتين";
  if (seconds >= 3 && seconds <= 10) return `${seconds} ثوانٍ`;
  return `${seconds} ثانية`;
}

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function CheckoutCountdown({ onConfirm, onCancel }: Props) {
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [displayNum, setDisplayNum] = useState(TOTAL_SECONDS);
  const [animKey, setAnimKey] = useState(0);
  const confirmedRef = useRef(false);

  const finalize = useCallback(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    onConfirm();
  }, [onConfirm]);

  useEffect(() => {
    if (seconds <= 0) {
      finalize();
      return;
    }

    const timer = window.setTimeout(() => {
      setSeconds((s) => s - 1);
      setDisplayNum((s) => s - 1);
      setAnimKey((k) => k + 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [seconds, finalize]);

  const progress = seconds / TOTAL_SECONDS;
  const strokeOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--bg-glass-strong)] px-5 backdrop-blur-sm motion-safe:animate-[velora-fade_0.35s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-countdown-title"
    >
      <div className="w-full max-w-sm text-center">
        <p
          id="checkout-countdown-title"
          className="font-display text-[1.35rem] font-medium text-[var(--plum)] sm:text-[1.5rem]"
        >
          هل أنتِ مستعدة لتأكيد طلبك؟
        </p>
        <p className="t3 mt-2 text-[var(--muted)]" dir="ltr">
          Your order is ready to be processed.
        </p>

        <div className="relative mx-auto mt-10 flex h-[9.5rem] w-[9.5rem] items-center justify-center sm:h-[10.5rem] sm:w-[10.5rem]">
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 120 120"
            aria-hidden
          >
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="var(--plum)"
              strokeOpacity="0.08"
              strokeWidth="2"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="var(--plum)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>

          <div
            key={animKey}
            className="motion-safe:animate-[velora-rise_0.28s_ease-out_both]"
          >
            <span
              className="font-display text-[3.5rem] font-semibold leading-none text-[var(--plum)] sm:text-[4rem]"
              aria-live="polite"
            >
              {displayNum > 0 ? displayNum : 0}
            </span>
          </div>
        </div>

        <p className="t3 mt-6 text-[var(--muted)]">
          تأكيد الطلب خلال{" "}
          <span className="font-medium text-[var(--plum)]">
            {displayNum > 0 ? formatCountdownArabic(displayNum) : "الآن"}
          </span>
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={finalize}
            className={cn(
              "t3 rounded-[14px] bg-[var(--plum)] px-6 py-3.5 font-medium text-[var(--ivory)] shadow-[0_6px_20px_-8px_rgba(61,38,64,0.45)] transition-all active:scale-[0.99]",
            )}
          >
            تأكيد الآن
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="t3 rounded-[14px] border border-[var(--plum)]/15 px-6 py-3.5 font-medium text-[var(--plum)] transition-colors hover:bg-[var(--mist)]/50"
          >
            التراجع
          </button>
        </div>
      </div>
    </div>
  );
}
