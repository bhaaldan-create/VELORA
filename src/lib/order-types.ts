import type { OrderPayload } from "@/lib/order-email";

export const ORDER_STATUSES = ["new", "preparing", "delivered"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "جديد",
  preparing: "قيد التجهيز",
  delivered: "تم التسليم",
};

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
};

export function normalizeStatus(value: unknown): OrderStatus {
  if (value === "preparing" || value === "delivered" || value === "new") {
    return value;
  }
  return "new";
}
