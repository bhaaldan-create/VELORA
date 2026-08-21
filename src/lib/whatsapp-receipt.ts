import { brand } from "@/constants/brand";
import { formatPrice } from "@/lib/utils";
import { resolveOrderTotal } from "@/lib/shipping";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/order-types";

/** يحوّل أرقام العراق إلى صيغة واتساب الدولية */
export function toWhatsAppPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("964") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length >= 10) {
    return `964${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("7")) {
    return `964${digits}`;
  }
  if (digits.length >= 10) return digits;
  return null;
}

export function getOrderTrackPath(orderId: string) {
  return `/track/${orderId}`;
}

export function getOrderReceiptPath(orderId: string) {
  return `/receipt/${orderId}`;
}

export function getAdminReceiptPath(orderId: string) {
  return `/admin/orders/${orderId}/receipt`;
}

/**
 * رسالة واتساب قصيرة ولطيفة — الوصل يُرسل كصورة مرفقة.
 */
export function buildWhatsAppReceiptMessage(entry: StoredOrder) {
  const firstName = entry.order.fullName.trim().split(/\s+/)[0] || "عزيزتي";

  return [
    `مرحباً ${firstName}،`,
    ``,
    `يسعدنا في ${brand.name} أن نخبركِ أن طلبكِ قيد التجهيز بعناية.`,
    `أرفقنا لكِ صورة وصل طلبكِ الرسمي.`,
    ``,
    `رقم الطلب: #${entry.orderId}`,
    `الإجمالي: ${formatPrice(resolveOrderTotal(entry.order))}`,
    ``,
    `شكراً لثقتكِ بجمالنا.`,
    `${brand.tagline}`,
  ].join("\n");
}

export function buildWhatsAppUrl(entry: StoredOrder) {
  const phone = toWhatsAppPhone(entry.order.phone);
  if (!phone) return null;
  const text = buildWhatsAppReceiptMessage(entry);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function statusMessageForCustomer(status: OrderStatus) {
  switch (status) {
    case "new":
      return "استلمنا طلبكِ وهو بانتظار التأكيد.";
    case "preparing":
      return "طلبكِ قيد التجهيز وتم إنشاء الوصل.";
    case "delivered":
      return "تم تسليم طلبكِ. نتمنى أن يعجبكِ!";
  }
}

export { ORDER_STATUS_LABELS };
