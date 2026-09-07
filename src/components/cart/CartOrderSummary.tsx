import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { WASEET_CARRIER } from "@/lib/shipping";
import { IconArrowStart, IconTruck } from "@/components/cart/CartIcons";
import { IconCheck } from "@/components/checkout/CheckoutIcons";
import "./cart-bag.css";

type Props = {
  subtotal: number;
  deliveryFee: number;
  total: number;
  className?: string;
  showCta?: boolean;
  compact?: boolean;
};

export function CartOrderSummary({
  subtotal,
  deliveryFee,
  total,
  className,
  showCta = true,
  compact = false,
}: Props) {
  return (
    <aside
      className={cn("bag-summary", className)}
      aria-label="ملخص الحقيبة"
    >
      {!compact ? <h2 className="bag-summary__title">ملخص الطلب</h2> : null}

      <dl className={cn("bag-summary__rows", compact && "!mt-0")}>
        <div className="bag-summary__row">
          <dt>المجموع الفرعي</dt>
          <dd className="font-price">{formatPrice(subtotal)}</dd>
        </div>
        <div className="bag-summary__row">
          <dt>أجور التوصيل</dt>
          <dd className="font-price">{formatPrice(deliveryFee)}</dd>
        </div>
      </dl>

      <div className="bag-carrier" role="group" aria-label="طريقة التوصيل">
        <div className="bag-carrier__meta">
          <span className="bag-carrier__icon">
            <IconTruck />
          </span>
          <div className="min-w-0">
            <p className="bag-carrier__name">{WASEET_CARRIER.nameAr}</p>
            <p className="bag-carrier__eta">2 – 4 أيام عمل</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B4F9C] px-2">
            <Image
              src={WASEET_CARRIER.logoBadge}
              alt={WASEET_CARRIER.nameEn}
              width={72}
              height={20}
              className="h-[16px] w-auto object-contain"
            />
          </span>
          <span className="bag-carrier__mark" aria-hidden>
            <IconCheck className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="bag-summary__total">
        <span className="bag-summary__total-label">الإجمالي</span>
        <span className="bag-summary__total-value font-price">
          {formatPrice(total)}
        </span>
      </div>

      {showCta ? (
        <Link href="/checkout" className="bag-cta">
          <span>إتمام الطلب</span>
          <IconArrowStart />
        </Link>
      ) : null}
    </aside>
  );
}
