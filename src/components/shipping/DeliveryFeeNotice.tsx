import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { DELIVERY_FEE_IQD, THAHAB_CARRIER } from "@/lib/shipping";

type Props = {
  feeIqd?: number;
  highlightAdded?: boolean;
  compact?: boolean;
};

/** شارة ذهب أكسبريس — الشعار أبيض على خلفية داكنة */
function ThahabBadge({ compact }: { compact?: boolean }) {
  const h = compact ? 32 : 36;
  const w = compact ? 118 : 136;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[6px] p-1 shadow-sm"
      style={{ width: w, height: h, background: THAHAB_CARRIER.badgeBg }}
    >
      <Image
        src={THAHAB_CARRIER.logoBadge}
        alt={THAHAB_CARRIER.nameEn}
        width={640}
        height={360}
        className="h-full w-full object-contain"
        sizes={`${w}px`}
        priority={false}
      />
    </span>
  );
}

export function DeliveryFeeNotice({
  feeIqd = DELIVERY_FEE_IQD,
  highlightAdded = true,
  compact = false,
}: Props) {
  return (
    <div
      className={
        compact
          ? "flex items-center gap-2.5"
          : "flex items-center gap-3 border border-[var(--plum)]/10 bg-white/80 px-3 py-3"
      }
    >
      <ThahabBadge compact={compact} />
      <div className="min-w-0 flex-1">
        <p className="t2 text-[var(--muted)]">
          التوصيل عبر {THAHAB_CARRIER.nameAr}
        </p>
        {highlightAdded ? (
          <p className="t3 mt-0.5 font-medium text-[var(--plum)]">
            تم إضافة <span className="font-price">{formatPrice(feeIqd)}</span> أجور توصيل
          </p>
        ) : (
          <p className="t3 mt-0.5 text-[var(--ink)]/75">
            أجور التوصيل: <span className="font-price">{formatPrice(feeIqd)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
