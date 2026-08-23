"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CartClearDialog({ open, onClose, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/35 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-clear-title"
        aria-describedby="cart-clear-desc"
        className={cn(
          "w-full max-w-sm rounded-[20px] border border-[var(--plum)]/10 bg-[var(--surface)] p-6 shadow-[0_20px_60px_-20px_rgba(61,38,64,0.35)]",
          "transition-opacity duration-200",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="cart-clear-title"
          className="font-display text-[1.2rem] font-medium text-[var(--plum)]"
        >
          إفراغ الحقيبة؟
        </h2>
        <p id="cart-clear-desc" className="t3 mt-2 leading-relaxed text-[var(--muted)]">
          هل أنتِ متأكدة من إزالة جميع المنتجات من حقيبتك؟
        </p>
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="t3 flex-1 rounded-[12px] border border-[var(--plum)]/15 px-4 py-2.5 font-medium text-[var(--plum)] transition-colors hover:bg-[var(--mist)]/60"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="t3 flex-1 rounded-[12px] bg-[var(--plum)] px-4 py-2.5 font-medium text-[var(--ivory)] transition-colors hover:bg-[var(--plum-soft)]"
          >
            إفراغ الحقيبة
          </button>
        </div>
      </div>
    </div>
  );
}
