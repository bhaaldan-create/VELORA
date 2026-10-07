/** أجور التوصيل عبر ذهب أكسبريس — تُضاف لكل طلب */
export const DELIVERY_FEE_IQD = 6000;

/** شركة التوصيل الحالية — ذهب أكسبريس */
export const THAHAB_CARRIER = {
  id: "thahab-express",
  nameEn: "Thahab Express",
  nameAr: "ذهب أكسبريس",
  slogan: "للتوصيل والخدمات اللوجستية",
  logo: "/shipping/thahab-express.png",
  /** الشعار أبيض — يُعرض على خلفية داكنة */
  logoBadge: "/shipping/thahab-express.png",
  /** خلفية شارة الشعار في الواجهة */
  badgeBg: "#1A1510",
  feeIqd: DELIVERY_FEE_IQD,
} as const;

/** الناقل الافتراضي للمتجر */
export const DEFAULT_CARRIER = THAHAB_CARRIER;

/**
 * Alias للتوافق مع الاستيرادات القديمة.
 * @deprecated استخدم THAHAB_CARRIER أو DEFAULT_CARRIER
 */
export const WASEET_CARRIER = THAHAB_CARRIER;

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
