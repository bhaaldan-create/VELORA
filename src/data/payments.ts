export type PaymentMethodId =
  | "cod"
  | "zain-cash"
  | "qi-card"
  | "visa"
  | "mastercard";

export type PaymentMethod = {
  id: PaymentMethodId;
  name: string;
  nameAr: string;
  descriptionAr: string;
  logo: string;
  /** خلفية الشارة إن كان الشعار فاتحاً (مثل زين كاش) */
  badgeClass?: string;
  invertOnDark?: boolean;
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "cod",
    name: "Cash on Delivery",
    nameAr: "الدفع عند الاستلام",
    descriptionAr: "ادفعي نقداً عند وصول الطلب.",
    logo: "/payments/cod.png",
  },
  {
    id: "zain-cash",
    name: "Zain Cash",
    nameAr: "زين كاش",
    descriptionAr: "محفظة زين كاش للدفع الفوري.",
    logo: "/payments/zain-cash.png",
    badgeClass: "bg-[#6B2D8B]",
  },
  {
    id: "qi-card",
    name: "Qi Card / Super Qi",
    nameAr: "كي كارد / سوبر كي",
    descriptionAr: "تحويل مباشر إلى حساب الشركة في سوبر كي.",
    logo: "/payments/qi-card.png",
    badgeClass: "bg-[#111111]",
  },
  {
    id: "visa",
    name: "Visa",
    nameAr: "فيزا",
    descriptionAr:
      "ادفعي بفيزا عبر سوبر كي — يُحوَّل المبلغ لحساب الشركة 910152619128.",
    logo: "/payments/visa.png",
  },
  {
    id: "mastercard",
    name: "Mastercard",
    nameAr: "ماستركارد",
    descriptionAr:
      "ادفعي بماستركارد عبر سوبر كي — يُحوَّل المبلغ لحساب الشركة 910152619128.",
    logo: "/payments/mastercard.png",
  },
];

export function getPaymentMethod(id: PaymentMethodId) {
  return paymentMethods.find((m) => m.id === id);
}
