import Link from "next/link";
import { PaymentMethodsRow } from "@/components/payments/PaymentMethods";
import { Button } from "@/components/ui/Button";

export function PaymentTrust() {
  return (
    <section className="border-y border-[var(--plum)]/10 bg-[var(--ivory)] py-16 sm:py-20">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-5 sm:px-8 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
            دفع آمن ومرن
          </p>
          <h2 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
            ادفعِ بالطريقة التي تناسبكِ
          </h2>
          <p className="t4 mt-4 text-[var(--ink)]/70">
            نوفر الدفع عند الاستلام، زين كاش، كي كارد، فيزا وماستركارد —
            بتجربة مرتبة وواضحة عند إتمام الطلب.
          </p>
          <Link href="/cart" className="mt-8 inline-block">
            <Button variant="outline">إتمام الطلب</Button>
          </Link>
        </div>
        <div className="w-full max-w-lg">
          <PaymentMethodsRow title="طرق الدفع" />
        </div>
      </div>
    </section>
  );
}
