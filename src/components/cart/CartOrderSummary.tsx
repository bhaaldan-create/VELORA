import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { WASEET_CARRIER } from "@/lib/shipping";
import { IconArrowStart, IconTruck } from "@/components/cart/CartIcons";

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
      className={cn(
        "rounded-[20px] border border-[var(--plum)]/8 bg-[var(--surface)] p-5 shadow-[0_4px_24px_-12px_rgba(61,38,64,0.1)] sm:p-6",
        className,
      )}
      aria-label="ملخص الحقيبة"
    >
      {!compact ? (
        <h2 className="font-display text-[1.2rem] font-medium text-[var(--plum)]">
          ملخص الطلب
        </h2>
      ) : null}

      <dl className={cn("space-y-3.5", !compact && "mt-5")}>
        <SummaryRow label="المجموع الفرعي" value={formatPrice(subtotal)} />
        <SummaryRow label="أجور التوصيل" value={formatPrice(deliveryFee)} />
      </dl>

      <div
        className="my-5 flex items-center justify-between gap-3 rounded-[14px] border border-[var(--plum)]/6 bg-[var(--ivory)]/70 px-3.5 py-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--plum)]/70">
            <IconTruck />
          </span>
          <div className="min-w-0">
            <p className="t2 text-[var(--muted)]">التوصيل</p>
            <p className="t3 mt-0.5 font-medium text-[var(--ink)]/85">
              {WASEET_CARRIER.nameAr}
            </p>
          </div>
        </div>
        <span className="inline-flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#1B4F9C] px-1.5">
          <Image
            src={WASEET_CARRIER.logoBadge}
            alt={WASEET_CARRIER.nameEn}
            width={72}
            height={20}
            className="h-[16px] w-auto object-contain"
          />
        </span>
      </div>

      <div
        className="h-px bg-[var(--plum)]/10"
        role="separator"
        aria-hidden
      />

      <div className="mt-5 flex items-baseline justify-between gap-4">
        <span className="font-display text-[1.05rem] font-medium text-[var(--plum)]">
          الإجمالي
        </span>
        <span className="font-display text-[1.4rem] font-semibold text-[var(--plum)]">
          {formatPrice(total)}
        </span>
      </div>

      {showCta ? (
        <Link
          href="/checkout"
          className={cn(
            "t3 mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--plum)] px-6 py-3.5 font-medium text-[var(--ivory)] shadow-[0_6px_20px_-8px_rgba(61,38,64,0.45)] transition-all duration-200",
            "hover:bg-[var(--plum-soft)] active:scale-[0.99]",
          )}
        >
          <span>إتمام الطلب</span>
          <IconArrowStart />
        </Link>
      ) : null}
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="t3 text-[var(--muted)]">{label}</dt>
      <dd className="t3 font-medium text-[var(--ink)]/90">{value}</dd>
    </div>
  );
}
