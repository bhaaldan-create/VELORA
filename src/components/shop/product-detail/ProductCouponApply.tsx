"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { CouponAppliedCeremony } from "@/components/cart/CouponAppliedCeremony";
import { couponDisplayPercent, useCouponQuote } from "@/components/cart/useCouponQuote";
import { formatPrice } from "@/lib/utils";

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
  const [rite, setRite] = useState(false);
  const closeRite = useCallback(() => setRite(false), []);

  useLayoutEffect(() => {
    if (!awaiting.current || coupon.loading) return;
    awaiting.current = false;
    if (coupon.quote && !coupon.error) setRite(true);
  }, [coupon.loading, coupon.quote, coupon.error]);

  const accepted = Boolean(coupon.quote && coupon.applied && !coupon.error);
  const percent = couponDisplayPercent(coupon.quote);
  const discount = coupon.quote?.couponDiscountIqd ?? 0;
  const freeShipping = (coupon.quote?.shippingDiscountIqd ?? 0) > 0;

  function apply() {
    if (!coupon.code.trim() || coupon.loading) return;
    awaiting.current = true;
    coupon.apply();
  }

  if (accepted) {
    const detail = [
      percent ? (ar ? `خصم ${percent}%` : `${percent}% off`) : "",
      discount > 0 ? formatPrice(discount) : freeShipping ? (ar ? "شحن مجاني" : "Free shipping") : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return (
      <>
        <CouponAppliedCeremony
          open={rite}
          percent={percent}
          ar={ar}
          onDone={closeRite}
        />
        <div className="pdp-coupon pdp-coupon-seal is-settled" role="status">
          <div className="pdp-coupon-seal__mark" aria-hidden>
            <svg viewBox="0 0 40 40">
              <circle className="pdp-coupon-seal__track" cx="20" cy="20" r="16" />
              <circle className="pdp-coupon-seal__ring" cx="20" cy="20" r="16" />
              <path className="pdp-coupon-seal__check" d="M12.5 20.5 l5 5 l10-11" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="pdp-coupon-seal__title">
              {ar ? "تم تطبيق الخصم" : "Discount applied"}
            </p>
            {detail ? <p className="pdp-coupon-seal__meta">{detail}</p> : null}
          </div>
          <button type="button" className="pdp-coupon-seal__clear" onClick={coupon.clear}>
            {ar ? "إزالة" : "Remove"}
          </button>
        </div>
      </>
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
