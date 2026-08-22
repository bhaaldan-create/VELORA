import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getCheckoutPaymentMethods } from "@/data/payments";
import { isWaylConfigured } from "@/lib/wayl";

export const metadata: Metadata = {
  title: "إتمام الطلب",
};

export default function CheckoutPage() {
  const waylEnabled = isWaylConfigured();
  const paymentMethods = getCheckoutPaymentMethods(waylEnabled);

  return (
    <CheckoutForm
      paymentMethods={paymentMethods}
      defaultPaymentMethod={waylEnabled ? "wayl" : "cod"}
    />
  );
}
