"use client";

import Image from "next/image";
import Link from "next/link";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";
import { cn } from "@/lib/utils";

type Props = {
  available: number;
  ar: boolean;
  compact?: boolean;
  className?: string;
  href?: string;
};

export function LoyaltyMembershipCard({
  available,
  ar,
  compact = false,
  className,
  href = "/account/rewards",
}: Props) {
  const iqd = LOYALTY_CONFIG.purchase.iqdPerPoint;
  const pointsLabel = available.toLocaleString(ar ? "ar-IQ" : "en-US");

  return (
    <Link
      href={href}
      className={cn(
        "vl-loyalty-card",
        compact && "vl-loyalty-card--compact",
        className,
      )}
      aria-label={ar ? "برنامج مكافآت Velora" : "Velora Rewards Program"}
    >
      <div className="vl-loyalty-card__glow" aria-hidden />
      <div className="vl-loyalty-card__inner">
        <div className="vl-loyalty-card__brand">
          <Image
            src="/brand/velora-logo-clear.png"
            alt="Velora Beauty"
            width={148}
            height={56}
            className="vl-loyalty-card__logo"
            priority={false}
          />
        </div>
        <p className="vl-loyalty-card__title">
          {ar ? "برنامج مكافآت Velora" : "Velora Rewards"}
        </p>
        <div className="vl-loyalty-card__balance">
          <span className="vl-loyalty-card__balance-label">
            {ar ? "رصيدك" : "Your balance"}
          </span>
          <span className="vl-loyalty-card__balance-value" dir="ltr">
            {pointsLabel}
          </span>
          <span className="vl-loyalty-card__balance-unit">
            {ar ? "نقطة" : "points"}
          </span>
        </div>
        <p className="vl-loyalty-card__rule">
          {ar
            ? `كل ${iqd.toLocaleString("ar-IQ")} د.ع من المشتريات = نقطة واحدة`
            : `Every ${iqd.toLocaleString("en-US")} IQD in purchases = 1 point`}
        </p>
        {!compact ? (
          <span className="vl-loyalty-card__cta">
            {ar ? "عرض التفاصيل" : "View details"}
            <span aria-hidden>{ar ? "←" : "→"}</span>
          </span>
        ) : null}
      </div>
    </Link>
  );
}
