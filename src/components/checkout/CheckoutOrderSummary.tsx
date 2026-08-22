import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { WASEET_CARRIER } from "@/lib/shipping";

type Props = {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  className?: string;
};

export function CheckoutOrderSummary({
  itemCount,
  subtotal,
  deliveryFee,
  total,
  className,
}: Props) {
  return (
    <aside
      className={cn(
        "rounded-[20px] border border-[var(--plum)]/8 bg-[var(--surface)] p-5 shadow-[0_4px_24px_-12px_rgba(61,38,64,0.1)] sm:p-6",
        className,
      )}
      aria-label="ملخص الطلب"
    >
      <h2 className="font-display text-[1.25rem] font-medium text-[var(--plum)]">
        ملخص الطلب
      </h2>

      <dl className="mt-5 space-y-3.5">
        <SummaryRow label="عدد المنتجات" value={String(itemCount)} />
        <SummaryRow label="المجموع الفرعي" value={formatPrice(subtotal)} />
        <SummaryRow label="أجور التوصيل" value={formatPrice(deliveryFee)} />
      </dl>

      <div
        className="my-5 h-px bg-[var(--plum)]/10"
        role="separator"
        aria-hidden
      />

      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-[1.05rem] font-medium text-[var(--plum)]">
          الإجمالي
        </span>
        <span className="font-display text-[1.35rem] font-semibold text-[var(--plum)]">
          {formatPrice(total)}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--plum)]/8 pt-4">
        <div className="min-w-0">
          <p className="t2 text-[var(--muted)]">التوصيل عبر</p>
          <p className="t3 mt-0.5 font-medium text-[var(--ink)]/85">
            {WASEET_CARRIER.nameAr}
          </p>
        </div>
        <span className="inline-flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#1B4F9C] px-1.5">
          <Image
            src={WASEET_CARRIER.logoBadge}
            alt={WASEET_CARRIER.nameEn}
            width={80}
            height={22}
            className="h-[18px] w-auto object-contain"
          />
        </span>
      </div>
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
