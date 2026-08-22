import { formatPrice } from "@/lib/utils";
import {
  resolveDeliveryFee,
  resolveOrderTotal,
  WASEET_CARRIER,
} from "@/lib/shipping";

export type OrderItemPayload = {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  quantity: number;
  size?: string;
};

export type OrderPayload = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  country?: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  /** Stripe PaymentIntent id عند الدفع بالبطاقة (إن وُجد) */
  paymentIntentId?: string;
  paymentStatus?: "paid" | "unpaid" | "pending";
  /** معرّف رابط الدفع في Wayl */
  waylLinkId?: string;
  /** رقم عملية التحويل من سوبر كي */
  transferReference?: string;
  /** رقم حساب سوبر كي المستلم */
  superQiAccount?: string;
  /** معرّف الزبون إن كان مسجّلاً */
  customerId?: string;
  notes?: string;
  items: OrderItemPayload[];
  /** مجموع المنتجات قبل التوصيل */
  subtotal: number;
  /** أجور التوصيل (شركة الوسط) */
  deliveryFee?: number;
  /** الإجمالي شامل التوصيل */
  total?: number;
  shippingCarrier?: string;
  shippingCarrierLabel?: string;
};

export function buildOrderEmail(order: OrderPayload, orderId: string) {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#3D2640;">${escapeHtml(item.nameAr)}</div>
          <div style="font-size:12px;color:#8B7A84;direction:ltr;">${escapeHtml(item.name)}${item.size ? ` · ${escapeHtml(item.size)}` : ""}</div>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:left;direction:ltr;">${formatPrice(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  const deliveryFee = resolveDeliveryFee(order);
  const total = resolveOrderTotal(order);
  const carrierLabel =
    order.shippingCarrierLabel || WASEET_CARRIER.nameAr;

  const subject = `طلب جديد VELORA #${orderId} — ${order.fullName}`;

  const text = [
    `طلب جديد من موقع VELORA`,
    `رقم الطلب: ${orderId}`,
    ``,
    `العميلة: ${order.fullName}`,
    `الهاتف: ${order.phone}`,
    `البريد: ${order.email}`,
    `العنوان: ${order.address}`,
    `طريقة الدفع: ${order.paymentMethodLabel}`,
    order.paymentStatus ? `حالة الدفع: ${order.paymentStatus}` : "",
    order.superQiAccount
      ? `حساب سوبر كي: ${order.superQiAccount}`
      : "",
    order.transferReference
      ? `رقم عملية التحويل: ${order.transferReference}`
      : "",
    order.paymentIntentId ? `مرجع الدفع: ${order.paymentIntentId}` : "",
    `التوصيل: ${carrierLabel}`,
    ``,
    ...order.items.map(
      (i) =>
        `- ${i.nameAr} (${i.name}) × ${i.quantity} = ${formatPrice(i.price * i.quantity)}`,
    ),
    ``,
    `المجموع الفرعي: ${formatPrice(order.subtotal)}`,
    `أجور التوصيل: ${formatPrice(deliveryFee)} (تم إضافتها)`,
    `الإجمالي: ${formatPrice(total)}`,
    order.notes ? `ملاحظات: ${order.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
  <div style="font-family:Tahoma,Arial,sans-serif;background:#F8F4F1;padding:24px;color:#1A121C;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #E9DFD6;">
      <div style="background:#3D2640;color:#F8F4F1;padding:20px 24px;">
        <div style="letter-spacing:0.25em;font-size:12px;">VELORA</div>
        <h1 style="margin:8px 0 0;font-size:22px;">طلب جديد من الموقع</h1>
        <div style="margin-top:6px;opacity:0.85;">رقم الطلب: <strong>#${escapeHtml(orderId)}</strong></div>
      </div>

      <div style="padding:24px;" dir="rtl">
        <h2 style="font-size:16px;color:#3D2640;margin:0 0 12px;">بيانات العميلة</h2>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#8B7A84;width:120px;">الاسم</td><td>${escapeHtml(order.fullName)}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7A84;">الهاتف</td><td dir="ltr">${escapeHtml(order.phone)}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7A84;">البريد</td><td dir="ltr">${escapeHtml(order.email)}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7A84;">العنوان</td><td>${escapeHtml(order.address)}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7A84;">التوصيل</td><td>${escapeHtml(carrierLabel)}</td></tr>
          <tr><td style="padding:6px 0;color:#8B7A84;">الدفع</td><td>${escapeHtml(order.paymentMethodLabel)}${order.paymentStatus === "paid" ? " ✓ مدفوع" : order.paymentStatus === "pending" ? " · بانتظار التحقق" : ""}</td></tr>
          ${
            order.superQiAccount
              ? `<tr><td style="padding:6px 0;color:#8B7A84;">سوبر كي</td><td dir="ltr">${escapeHtml(order.superQiAccount)}</td></tr>`
              : ""
          }
          ${
            order.transferReference
              ? `<tr><td style="padding:6px 0;color:#8B7A84;">رقم التحويل</td><td dir="ltr">${escapeHtml(order.transferReference)}</td></tr>`
              : ""
          }
          ${
            order.paymentIntentId
              ? `<tr><td style="padding:6px 0;color:#8B7A84;">مرجع الدفع</td><td dir="ltr">${escapeHtml(order.paymentIntentId)}</td></tr>`
              : ""
          }
        </table>

        <h2 style="font-size:16px;color:#3D2640;margin:24px 0 12px;">المنتجات</h2>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <thead>
            <tr style="background:#F1EAE6;text-align:right;">
              <th style="padding:8px;">المنتج</th>
              <th style="padding:8px;text-align:center;">الكمية</th>
              <th style="padding:8px;text-align:left;">المبلغ</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top:14px;font-size:14px;color:#3D2640;">
          <div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span>المجموع الفرعي</span>
            <span dir="ltr">${formatPrice(order.subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span>أجور التوصيل (${escapeHtml(carrierLabel)}) — تم إضافة ${formatPrice(deliveryFee)}</span>
            <span dir="ltr">${formatPrice(deliveryFee)}</span>
          </div>
        </div>

        <div style="margin-top:12px;padding-top:14px;border-top:2px solid #3D2640;font-size:18px;font-weight:700;color:#3D2640;display:flex;justify-content:space-between;">
          <span>الإجمالي</span>
          <span dir="ltr">${formatPrice(total)}</span>
        </div>

        ${
          order.notes
            ? `<p style="margin-top:16px;font-size:13px;color:#8B7A84;"><strong>ملاحظات:</strong> ${escapeHtml(order.notes)}</p>`
            : ""
        }
      </div>
    </div>
  </div>`;

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
