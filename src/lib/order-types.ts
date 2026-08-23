import type { OrderPayload } from "@/lib/order-email";

/**
 * Unified VELORA order status architecture.
 * Legacy values (new / preparing / delivered) remain first-class.
 */
export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "ready_to_ship",
  "handed_to_courier",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "deferred",
  "cancelled",
  "returned",
  "failed_delivery",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "جديد",
  confirmed: "تم تأكيد الطلب",
  preparing: "قيد التجهيز",
  ready_to_ship: "جاهز للشحن",
  handed_to_courier: "تم تسليم الطلب لشركة التوصيل",
  in_transit: "في الطريق",
  out_for_delivery: "خرج للتسليم",
  delivered: "تم التسليم",
  deferred: "مؤجل",
  cancelled: "ملغي",
  returned: "مرتجع",
  failed_delivery: "فشل التسليم",
};

/** Compact labels for dense UI */
export const ORDER_STATUS_SHORT: Record<OrderStatus, string> = {
  new: "جديد",
  confirmed: "مؤكد",
  preparing: "تجهيز",
  ready_to_ship: "جاهز للشحن",
  handed_to_courier: "مع التوصيل",
  in_transit: "في الطريق",
  out_for_delivery: "خرج للتسليم",
  delivered: "تم التسليم",
  deferred: "مؤجل",
  cancelled: "ملغي",
  returned: "مرتجع",
  failed_delivery: "فشل",
};

export type OrderStatusTone =
  | "neutral"
  | "info"
  | "progress"
  | "shipping"
  | "success"
  | "warning"
  | "danger";

export const ORDER_STATUS_TONE: Record<OrderStatus, OrderStatusTone> = {
  new: "info",
  confirmed: "info",
  preparing: "progress",
  ready_to_ship: "progress",
  handed_to_courier: "shipping",
  in_transit: "shipping",
  out_for_delivery: "shipping",
  delivered: "success",
  deferred: "warning",
  cancelled: "danger",
  returned: "warning",
  failed_delivery: "danger",
};

/** Linear fulfillment path (excludes deferred/cancelled/returned/failed) */
export const ORDER_TIMELINE: OrderStatus[] = [
  "new",
  "confirmed",
  "preparing",
  "ready_to_ship",
  "handed_to_courier",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export type StoredOrder = {
  savedAt: string;
  updatedAt?: string;
  orderId: string;
  subject: string;
  emailedTo?: string;
  status: OrderStatus;
  order: OrderPayload;
  text: string;
  adminNote?: string;
  /** متى أُنشئ/أُرسل وصل واتساب */
  receiptSentAt?: string;
  /** رقم تتبع شركة التوصيل — اختياري */
  trackingNumber?: string;
};

const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  new: "new",
  confirmed: "confirmed",
  preparing: "preparing",
  ready_to_ship: "ready_to_ship",
  handed_to_courier: "handed_to_courier",
  in_transit: "in_transit",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  deferred: "deferred",
  cancelled: "cancelled",
  returned: "returned",
  failed_delivery: "failed_delivery",
  // aliases
  shipped: "handed_to_courier",
  shipping: "in_transit",
  canceled: "cancelled",
};

export function normalizeStatus(value: unknown): OrderStatus {
  if (typeof value !== "string") return "new";
  return LEGACY_STATUS_MAP[value] ?? "new";
}

export function isFulfillmentStatus(status: OrderStatus): boolean {
  return ORDER_TIMELINE.includes(status);
}

export function orderTimelineProgress(status: OrderStatus): number {
  const idx = ORDER_TIMELINE.indexOf(status);
  if (idx < 0) return -1;
  return idx;
}
