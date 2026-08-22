import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getStoredOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import { ui } from "@/constants/brand";

export const metadata: Metadata = {
  title: "تم الدفع",
};

type PageProps = {
  searchParams: Promise<{
    referenceId?: string;
    orderid?: string;
  }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderId = (params.referenceId || params.orderid || "").trim();
  const entry = orderId ? await getStoredOrder(orderId) : null;
  const paid = entry?.order.paymentStatus === "paid";

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
        {paid ? "تم الدفع" : "شكراً لكِ"}
      </p>
      <h1 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
        {paid ? "تم استلام دفعتكِ بنجاح" : ui.thankYou}
      </h1>
      <p className="t4 mt-4 text-[var(--ink)]/70">
        {paid
          ? "سيبدأ فريق VELORA بتجهيز طلبكِ قريباً."
          : "إذا أكملتِ الدفع للتو، قد يستغرق التأكيد بضع ثوانٍ. يمكنكِ متابعة حالة الطلب أدناه."}
      </p>

      {orderId ? (
        <div className="mt-8 space-y-3 border border-[var(--plum)]/15 bg-[var(--mist)] px-5 py-5 text-start">
          <p className="t3 text-[var(--muted)]">
            رقم الطلب: <span dir="ltr">#{orderId}</span>
          </p>
          {entry ? (
            <>
              <p className="t3 text-[var(--ink)]/80">
                الإجمالي:{" "}
                {formatPrice(
                  entry.order.total ??
                    entry.order.subtotal + (entry.order.deliveryFee ?? 0),
                )}
              </p>
              <p className="t3 text-[var(--ink)]/80">
                حالة الدفع:{" "}
                {paid ? "مدفوع ✓" : "بانتظار التأكيد"}
              </p>
            </>
          ) : null}
          <Link
            href={`/track/${orderId}`}
            className="t3 inline-block text-[var(--plum)] underline-offset-4 hover:underline"
          >
            تتبّع الطلب
          </Link>
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/shop">
          <Button>{ui.continueShopping}</Button>
        </Link>
        <Link href="/account">
          <Button variant="outline">حسابي</Button>
        </Link>
      </div>
    </div>
  );
}
