import { z } from "zod";
import {
  getMailConfigIssue,
  getWebhookUrl,
  isMailConfigured,
  mapSmtpError,
  ORDER_EMAIL_TO,
  sendOrderEmail,
} from "@/lib/mail";
import { buildOrderEmail, type OrderPayload } from "@/lib/order-email";
import { normalizeIraqMobile } from "@/lib/phone";
import { isSuperQiPaymentMethod, SUPER_QI_ACCOUNT } from "@/lib/super-qi";
import { isWaylPaymentMethod } from "@/data/payments";
import {
  DELIVERY_FEE_IQD,
  getOrderTotal,
  WASEET_CARRIER,
} from "@/lib/shipping";

const orderSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  city: z.string().optional(),
  country: z.string().optional(),
  paymentMethod: z.string().min(1),
  paymentMethodLabel: z.string().min(1),
  paymentIntentId: z.string().optional(),
  paymentStatus: z.enum(["paid", "unpaid", "pending"]).optional(),
  transferReference: z.string().min(4).max(80).optional(),
  superQiAccount: z.string().optional(),
  customerId: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        nameAr: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
        size: z.string().optional(),
      }),
    )
    .min(1),
  subtotal: z.number().positive(),
  deliveryFee: z.number().nonnegative().optional(),
  total: z.number().positive().optional(),
  shippingCarrier: z.string().optional(),
  shippingCarrierLabel: z.string().optional(),
});

export async function GET() {
  return Response.json({
    ok: true,
    configured: isMailConfigured(),
    provider: getWebhookUrl() ? "google-apps-script" : "local-inbox",
    orderEmailTo: ORDER_EMAIL_TO,
    webhookConfigured: Boolean(getWebhookUrl()),
    superQiAccount: SUPER_QI_ACCOUNT.number,
    issue: getMailConfigIssue(),
    inbox: "/admin/orders",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات الطلب غير مكتملة أو غير صحيحة." },
        { status: 400 },
      );
    }

    const order = parsed.data as OrderPayload;

    const normalizedPhone = normalizeIraqMobile(order.phone);
    if (!normalizedPhone) {
      return Response.json(
        {
          ok: false,
          error: "رقم الجوال غير صالح. استخدمي صيغة 07XXXXXXXXX.",
        },
        { status: 400 },
      );
    }
    order.phone = normalizedPhone;

    order.deliveryFee =
      typeof order.deliveryFee === "number"
        ? order.deliveryFee
        : DELIVERY_FEE_IQD;
    order.shippingCarrier = order.shippingCarrier || WASEET_CARRIER.id;
    order.shippingCarrierLabel =
      order.shippingCarrierLabel || WASEET_CARRIER.nameAr;
    order.total = getOrderTotal(order.subtotal, order.deliveryFee);

    if (isSuperQiPaymentMethod(order.paymentMethod)) {
      if (!order.transferReference?.trim()) {
        return Response.json(
          {
            ok: false,
            error: "رقم عملية التحويل من سوبر كي مطلوب.",
          },
          { status: 400 },
        );
      }
      order.superQiAccount = SUPER_QI_ACCOUNT.number;
      order.paymentStatus = "pending";
      order.transferReference = order.transferReference.trim();
    } else if (isWaylPaymentMethod(order.paymentMethod)) {
      order.paymentStatus = "unpaid";
    } else {
      order.paymentStatus = order.paymentStatus || "unpaid";
    }

    const orderId = createOrderId();
    const email = buildOrderEmail(order, orderId);

    const result = await sendOrderEmail({
      order,
      orderId,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    return Response.json({
      ok: true,
      orderId,
      emailed: result.emailed,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    console.error("[orders] failed", error);
    return Response.json(
      {
        ok: false,
        error: mapSmtpError(error),
      },
      { status: 500 },
    );
  }
}

function createOrderId() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${stamp.slice(2)}${rand}`;
}
