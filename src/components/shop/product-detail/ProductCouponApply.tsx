"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCouponQuote } from "@/components/cart/useCouponQuote";
import { cn, formatPrice } from "@/lib/utils";

type Props = {
  productId: string;
  quantity: number;
  ar: boolean;
};

export function ProductCouponApply({ productId, quantity, ar }: Props) {
  const coupon = useCouponQuote({
    items: [{ id: productId, quantity }],
  });
  const awaiting = useRef(false);
  const [phase, setPhase] = useState<"idle" | "live" | "settled" | "quiet">("idle");
  const [seconds, setSeconds] = useState(3);

  useLayoutEffect(() => {
    if (!awaiting.current || coupon.loading) return;
    awaiting.current = false;
    if (coupon.quote && !coupon.error) {
      setPhase("live");
      setSeconds(3);
    }
  }, [coupon.loading, coupon.quote, coupon.error]);

  useEffect(() => {
    if (phase !== "live") return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const left = Math.ceil(3 - (Date.now() - started) / 1000);
      if (left <= 0) {
        setSeconds(0);
        setPhase("settled");
        window.clearInterval(timer);
      } else {
        setSeconds(left);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [phase]);

  const accepted = Boolean(coupon.quote && coupon.applied && !coupon.error);
  const discount = coupon.quote?.couponDiscountIqd ?? 0;
  const freeShipping = (coupon.quote?.shippingDiscountIqd ?? 0) > 0;

  function apply() {
    if (!coupon.code.trim() || coupon.loading) return;
    awaiting.current = true;
    setPhase("idle");
    coupon.apply();
  }

  if (accepted) {
    return (
      <div
        className={cn(
          "pdp-coupon pdp-coupon-seal",
          phase === "live" && "is-live",
          phase === "settled" && "is-settled",
          phase !== "live" && phase !== "settled" && "is-quiet",
        )}
        role="status"
      >
        <div className="pdp-coupon-seal__mark" aria-hidden>
          <svg viewBox="0 0 40 40">
            <circle className="pdp-coupon-seal__track" cx="20" cy="20" r="16" />
            <circle className="pdp-coupon-seal__ring" cx="20" cy="20" r="16" />
            <path className="pdp-coupon-seal__check" d="M12.5 20.5 l5 5 l10-11" />
          </svg>
          {phase === "live" && seconds > 0 ? (
            <span className="pdp-coupon-seal__count">{seconds}</span>
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="pdp-coupon-seal__title">
            {coupon.quote?.discountPercent
              ? ar
                ? `خصم ${coupon.quote.discountPercent}%`
                : `${coupon.quote.discountPercent}% off`
              : ar
                ? "تم تطبيق الخصم"
                : "Discount applied"}
          </p>
          <p className="pdp-coupon-seal__meta">
            {discount > 0
              ? formatPrice(discount)
              : freeShipping
                ? ar
                  ? "شحن مجاني"
                  : "Free shipping"
                : ""}
          </p>
        </div>
        <button type="button" className="pdp-coupon-seal__clear" onClick={coupon.clear}>
          {ar ? "إزالة" : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <div className="pdp-coupon">
      <div className="pdp-coupon__row">
        <input
          id="pdp-coupon-code"
          value={coupon.code}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder={ar ? "كود الخصم" : "Discount code"}
          aria-label={ar ? "كود الخصم" : "Discount code"}
          onChange={(event) => coupon.setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
          className="pdp-coupon__input"
        />
        <button
          type="button"
          className="pdp-coupon__apply"
          onClick={apply}
          disabled={coupon.loading || !coupon.code.trim()}
        >
          {coupon.loading ? "…" : ar ? "تطبيق" : "Apply"}
        </button>
      </div>
      {coupon.error ? (
        <p className="pdp-coupon__error" role="alert">
          {coupon.error}
        </p>
      ) : null}
    </div>
  );
}
