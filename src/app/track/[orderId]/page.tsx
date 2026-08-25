import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/constants/brand";
import { getStoredOrder } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-types";
import { formatPrice } from "@/lib/utils";
import { statusMessageForCustomer } from "@/lib/whatsapp-receipt";
import {
  resolveDeliveryFee,
  resolveOrderTotal,
  WASEET_CARRIER,
} from "@/lib/shipping";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ orderId: string }> };

export default async function TrackOrderPage({ params }: Props) {
  const { orderId } = await params;
  const entry = await getStoredOrder(orderId);
  if (!entry) notFound();

  const deliveryFee = resolveDeliveryFee(entry.order);
  const total = resolveOrderTotal(entry.order);

  return (
    <main
      className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-12 sm:px-8"
      dir="rtl"
    >
      <p className="t1 font-medium tracking-[0.22em] text-[var(--muted)]">
        {brand.name}
      </p>
      <h1 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
        تتبع الطلب
      </h1>
      <p className="t3 mt-2 text-[var(--muted)]" dir="ltr">
        #{entry.orderId}
      </p>

      <div className="mt-8 border border-[var(--plum)]/15 bg-white p-6">
        <p className="t2 text-[var(--muted)]">الحالة الحالية</p>
        <p className="font-display t6 mt-2 text-[var(--plum)]">
          {ORDER_STATUS_LABELS[entry.status]}
        </p>
        <p className="t3 mt-3 text-[var(--ink)]/75">
          {statusMessageForCustomer(entry.status)}
        </p>

        <div className="mt-6 space-y-2 border-t border-[var(--plum)]/10 pt-4 t3">
          <p>
            <span className="text-[var(--muted)]">الاسم: </span>
            {entry.order.fullName}
          </p>
          <p>
            <span className="text-[var(--muted)]">العنوان: </span>
            {entry.order.address}
          </p>
          <p>
            <span className="text-[var(--muted)]">الدفع: </span>
            {entry.order.paymentMethodLabel}
          </p>
        </div>

        <ul className="mt-6 space-y-2 border-t border-[var(--plum)]/10 pt-4">
          {entry.order.items.map((item) => (
            <li
              key={`${item.id}-${item.size || ""}`}
              className="t3 flex justify-between gap-3"
            >
              <span>
                {item.nameAr} × {item.quantity}
              </span>
              <span className="font-price">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
          {deliveryFee > 0 ? (
            <li className="t3 flex justify-between gap-3 text-[var(--plum)]">
              <span>
                أجور التوصيل ·{" "}
                {entry.order.shippingCarrierLabel || WASEET_CARRIER.nameAr}
              </span>
              <span className="font-price">{formatPrice(deliveryFee)}</span>
            </li>
          ) : null}
        </ul>

        <div className="mt-4 flex justify-between border-t border-[var(--plum)] pt-3 t4 font-medium text-[var(--plum)]">
          <span>الإجمالي</span>
          <span className="font-price">{formatPrice(total)}</span>
        </div>
      </div>

      <Link
        href="/shop"
        className="t3 mt-10 text-center text-[var(--plum)] underline-offset-4 hover:underline"
      >
        متابعة التسوق في {brand.name}
      </Link>
    </main>
  );
}
