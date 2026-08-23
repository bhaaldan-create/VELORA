import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getCheckoutPaymentMethods } from "@/data/payments";
import { isWaylCheckoutAvailable } from "@/lib/wayl";

export const metadata: Metadata = {
  title: "إتمام الطلب",
};

export default async function CheckoutPage() {
  const waylEnabled = await isWaylCheckoutAvailable();
  const paymentMethods = getCheckoutPaymentMethods(waylEnabled);

  return (
    <CheckoutForm
      paymentMethods={paymentMethods}
      defaultPaymentMethod={waylEnabled ? "wayl" : "cod"}
    />
  );
}
