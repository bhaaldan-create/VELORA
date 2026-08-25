"use client";

import { formatPrice } from "@/lib/utils";
import { SUPER_QI_ACCOUNT } from "@/lib/super-qi";

type Props = {
  amountIqd: number;
  paymentLabelAr: string;
  onOpen: () => void;
  transferReference?: string | null;
};

/** بطاقة مختصرة تحت اختيار فيزا/ماستركارد/كي */
export function SuperQiPaymentTeaser({
  amountIqd,
  paymentLabelAr,
  onOpen,
  transferReference,
}: Props) {
  return (
    <div className="border border-[var(--plum)]/15 bg-[var(--mist)] p-5">
      <p className="t1 font-medium tracking-[0.14em] text-[var(--muted)]">
        الدفع عبر سوبر كي
      </p>
      <h3 className="font-display t5 mt-2 text-[var(--plum)]">
        تحويل مباشر لحساب الشركة
      </h3>
      <p className="t3 mt-2 text-[var(--ink)]/70">
        اخترتِ {paymentLabelAr}. حوّلي المبلغ{" "}
        <strong className="font-price text-[var(--plum)]">{formatPrice(amountIqd)}</strong>{" "}
        إلى حساب سوبر كي التالي:
      </p>
      <p
        className="font-display t5 mt-3 tracking-[0.1em] text-[var(--plum)]"
        dir="ltr"
      >
        {SUPER_QI_ACCOUNT.number}
      </p>
      {transferReference ? (
        <p className="t3 mt-3 border border-green-200 bg-green-50 px-3 py-2 text-green-900">
          تم تسجيل رقم التحويل:{" "}
          <span dir="ltr">{transferReference}</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="t3 mt-5 w-full border border-[var(--plum)] bg-[var(--plum)] px-4 py-3 text-[var(--ivory)]"
        >
          فتح نافذة التحويل إلى سوبر كي
        </button>
      )}
    </div>
  );
}
