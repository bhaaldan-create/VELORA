export type PaymentMethodId = "cod" | "wayl";

export type PaymentMethod = {
  id: PaymentMethodId;
  name: string;
  nameAr: string;
  descriptionAr: string;
  logo: string;
  badgeClass?: string;
  invertOnDark?: boolean;
};

/** طرق الدفع المعروضة في صفحة إتمام الطلب — Wayl + الدفع عند الاستلام فقط */
export const checkoutPaymentMethods: PaymentMethod[] = [
  {
    id: "wayl",
    name: "Wayl",
    nameAr: "الدفع الإلكتروني",
    descriptionAr:
      "بطاقة، محفظة، أو تحويل — دفع آمن عبر بوابة Wayl العراقية.",
    logo: "/payments/wayl.svg",
    badgeClass: "bg-[#0F766E]",
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    nameAr: "الدفع عند الاستلام",
    descriptionAr: "ادفعي نقدًا عند وصول طلبك.",
    logo: "/payments/cod.png",
  },
];

/** للفوتر والعرض العام — بدون طرق الدفع القديمة */
export const paymentMethods: PaymentMethod[] = checkoutPaymentMethods;
export function getPaymentMethod(id: PaymentMethodId) {
  return paymentMethods.find((m) => m.id === id);
}

/** طرق الدفع في صفحة إتمام الطلب */
export function getCheckoutPaymentMethods(waylEnabled: boolean): PaymentMethod[] {
  if (waylEnabled) {
    return checkoutPaymentMethods;
  }
  return checkoutPaymentMethods.filter((m) => m.id === "cod");
}
export function isWaylPaymentMethod(method: string) {
  return method === "wayl";
}
