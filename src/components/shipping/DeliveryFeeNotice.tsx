import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { DELIVERY_FEE_IQD, WASEET_CARRIER } from "@/lib/shipping";

type Props = {
  feeIqd?: number;
  highlightAdded?: boolean;
  compact?: boolean;
};

/** شارة وسط بحجم شارات الدفع — الصورة كاملة بدون قص CSS */
function WaseetBadge({ compact }: { compact?: boolean }) {
  const h = compact ? 28 : 32;
  const w = compact ? 108 : 124;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-[#1B4F9C] p-0.5 shadow-sm"
      style={{ width: w, height: h }}
    >
      <Image
        src={WASEET_CARRIER.logoBadge}
        alt={`${WASEET_CARRIER.nameEn}`}
        width={501}
        height={129}
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
      <WaseetBadge compact={compact} />
      <div className="min-w-0 flex-1">
        <p className="t2 text-[var(--muted)]">
          التوصيل عبر {WASEET_CARRIER.nameAr}
        </p>
        {highlightAdded ? (
          <p className="t3 mt-0.5 font-medium text-[var(--plum)]">
            تم إضافة {formatPrice(feeIqd)} أجور توصيل
          </p>
        ) : (
          <p className="t3 mt-0.5 text-[var(--ink)]/75">
            أجور التوصيل: {formatPrice(feeIqd)}
          </p>
        )}
      </div>
    </div>
  );
}
