import type { Metadata } from "next";
import { CheckoutSuccessClient } from "@/components/checkout/CheckoutSuccessClient";
import { getStoredOrder } from "@/lib/orders";

export const metadata: Metadata = {
  title: "تم تأكيد الطلب",
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

  if (!orderId) {
    return (
      <CheckoutSuccessClient orderId="" paid={paid} />
    );
  }

  return <CheckoutSuccessClient orderId={orderId} paid={paid} />;
}
