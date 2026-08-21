/** أجور التوصيل عبر شركة الوسط — تُضاف لكل طلب */
export const DELIVERY_FEE_IQD = 6000;

export const WASEET_CARRIER = {
  id: "waseet",
  nameEn: "Waseet Company",
  nameAr: "شركة الوسط",
  slogan: "Deliver Faster",
  logo: "/shipping/waseet.png",
  /** نسخة مقصوصة بإحكام حول الشعار والنص فقط */
  logoBadge: "/shipping/waseet-badge.png",
  feeIqd: DELIVERY_FEE_IQD,
} as const;

export function getOrderTotal(
  subtotal: number,
  deliveryFee: number = DELIVERY_FEE_IQD,
) {
  return Math.max(0, subtotal) + Math.max(0, deliveryFee);
}

export function resolveDeliveryFee(order: {
  deliveryFee?: number | null;
  subtotal: number;
  total?: number | null;
}) {
  if (typeof order.deliveryFee === "number" && order.deliveryFee >= 0) {
    return order.deliveryFee;
  }
  if (typeof order.total === "number" && order.total >= order.subtotal) {
    return order.total - order.subtotal;
  }
  /** طلبات قديمة بلا حقل توصيل */
  return 0;
}

export function resolveOrderTotal(order: {
  deliveryFee?: number | null;
  subtotal: number;
  total?: number | null;
}) {
  if (typeof order.total === "number" && order.total > 0) {
    return order.total;
  }
  return getOrderTotal(order.subtotal, resolveDeliveryFee(order));
}
