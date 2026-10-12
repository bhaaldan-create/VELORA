"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./coupon-applied.css";

type Props = {
  open: boolean;
  percent: number | null;
  ar?: boolean;
  onDone: () => void;
};

export function CouponAppliedCeremony({ open, percent, ar = true, onDone }: Props) {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<"count" | "check" | "leave">("count");
  const [seconds, setSeconds] = useState(3);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSeconds(3);
    if (reduce) {
      setStage("check");
      return;
    }
    setStage("count");
    const started = Date.now();
    const timer = window.setInterval(() => {
      const left = Math.ceil(3 - (Date.now() - started) / 1000);
      if (left <= 0) {
        setSeconds(0);
        setStage("check");
        window.clearInterval(timer);
      } else {
        setSeconds(left);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open || stage !== "check") return;
    const hold = window.setTimeout(() => setStage("leave"), 1500);
    return () => window.clearTimeout(hold);
  }, [open, stage]);

  useEffect(() => {
    if (!open || stage !== "leave") return;
    const timer = window.setTimeout(() => doneRef.current(), 420);
    return () => window.clearTimeout(timer);
  }, [open, stage]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const title = ar ? "تم تطبيق الخصم" : "Discount applied";
  const detail = percent ? (ar ? `خصم ${percent}%` : `${percent}% off`) : "";

  return createPortal(
    <div className={`coupon-rite is-${stage}`} role="status" aria-live="polite">
      <div className="coupon-rite__veil" />
      <div className="coupon-rite__card">
        <div className="coupon-rite__mark" aria-hidden>
          <svg viewBox="0 0 140 140">
            <circle className="coupon-rite__track" cx="70" cy="70" r="54" />
            <circle className="coupon-rite__ring" cx="70" cy="70" r="54" />
            <path className="coupon-rite__check" d="M52 72 l12 12 l26-28" />
          </svg>
          {stage === "count" ? (
            <span key={seconds} className="coupon-rite__num">{seconds}</span>
          ) : null}
        </div>
        <div className="coupon-rite__copy">
          <p className="coupon-rite__title">{title}</p>
          {detail ? <p className="coupon-rite__percent">{detail}</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
