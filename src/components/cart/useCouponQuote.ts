"use client";

import { useEffect, useState } from "react";

export type CouponQuote = {
  couponCode: string | null;
  discountPercent: number | null;
  merchandiseSubtotal: number;
  productDiscountIqd: number;
  couponDiscountIqd: number;
  shippingDiscountIqd: number;
  deliveryFee: number;
  total: number;
};

const KEY = "velora.coupon";

export function useCouponQuote(input: {
  items: { id: string; quantity: number }[];
  customerId?: string;
  phone?: string;
  email?: string;
}) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const [quote, setQuote] = useState<CouponQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signature = input.items.map((item) => `${item.id}:${item.quantity}`).join("|");

  useEffect(() => {
    const saved = window.sessionStorage.getItem(KEY) || "";
    setCode(saved);
    setApplied(saved);
  }, []);

  useEffect(() => {
    if (!applied || input.items.length === 0) {
      setQuote(null);
      if (!applied) setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    void fetch("/api/coupons/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        couponCode: applied,
        items: input.items,
        customerId: input.customerId,
        phone: input.phone,
        email: input.email,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = (await res.json()) as CouponQuote & { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) {
          setQuote(null);
          setError(json.error || "تعذّر التحقق من الكود.");
          return;
        }
        setError(null);
        setQuote(json);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("تعذّر التحقق من الكود.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
    // signature covers item identity; phone/email refresh eligibility
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, signature, input.customerId, input.phone, input.email]);

  function apply() {
    const next = code.trim();
    setApplied(next);
    if (next) window.sessionStorage.setItem(KEY, next);
    else window.sessionStorage.removeItem(KEY);
  }

  function clear() {
    setCode("");
    setApplied("");
    setQuote(null);
    setError(null);
    window.sessionStorage.removeItem(KEY);
  }

  return { code, setCode, applied, quote, error, loading, apply, clear };
}
