import type { OrderPayload } from "@/lib/order-email";
import type { OrderStatus, StoredOrder } from "@/lib/order-types";
import { resolveOrderTotal } from "@/lib/shipping";

const TEST_EMAIL_PATTERNS = [
  /^test@/i,
  /@test\./i,
  /\+test@/i,
  /@example\.com$/i,
  /@mailinator\./i,
];

const TEST_NAME_PATTERNS = [/^test\b/i, /^demo\b/i, /^fake\b/i];

const TEST_ORDER_ID_PATTERNS = [/^TEST-/i, /^DEV-/i, /^DEMO-/i];

export function isTestOrder(
  orderId: string,
  order: OrderPayload,
  adminNote?: string,
): boolean {
  if (TEST_ORDER_ID_PATTERNS.some((re) => re.test(orderId))) return true;

  const email = (order.email || "").trim().toLowerCase();
  if (email && TEST_EMAIL_PATTERNS.some((re) => re.test(email))) return true;

  const name = (order.fullName || "").trim();
  if (name && TEST_NAME_PATTERNS.some((re) => re.test(name))) return true;

  const note = (adminNote || "").toLowerCase();
  if (note.includes("test order") || note.includes("طلب تجريبي")) return true;

  return false;
}

function isCashOnDelivery(order: OrderPayload): boolean {
  const method = (order.paymentMethod || "").trim().toLowerCase();
  return (
    method === "cod" ||
    method === "cash_on_delivery" ||
    method === "cash" ||
    method.includes("cod")
  );
}

/**
 * Online unpaid (Wayl/card) must not get a card.
 * COD is always eligible once the order is delivered — checkout stores COD as
 * paymentStatus "unpaid" until collection, so COD is checked before unpaid.
 */
export function isPaidOrder(order: OrderPayload): boolean {
  if (isCashOnDelivery(order)) return true;
  if (order.paymentStatus === "paid") return true;
  if (order.paymentStatus === "unpaid") return false;
  if (order.paymentIntentId || order.waylLinkId || order.transferReference) {
    return true;
  }
  // Legacy rows without paymentStatus
  return true;
}

export function isDeliveredOrderStatus(status: OrderStatus): boolean {
  return status === "delivered";
}

export function isMyVeloraEligibleOrder(entry: StoredOrder): boolean {
  if (!isDeliveredOrderStatus(entry.status)) return false;
  if (isTestOrder(entry.orderId, entry.order, entry.adminNote)) return false;
  if (!isPaidOrder(entry.order)) return false;
  if (!entry.order.items?.length) return false;
  const total = resolveOrderTotal(entry.order);
  if (total <= 0) return false;
  return true;
}

export function orderBelongsToCustomer(
  entry: StoredOrder,
  customerId: string,
  email: string,
): boolean {
  const byId = entry.order.customerId === customerId;
  const byEmail =
    (entry.order.email || "").trim().toLowerCase() === email.trim().toLowerCase();
  return byId || byEmail;
}
