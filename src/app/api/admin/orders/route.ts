import { z } from "zod";
import { assertAdminModule } from "@/lib/admin/guard";
import { buildOrderEmail, type OrderPayload } from "@/lib/order-email";
import {
  countOrdersByStatus,
  createOrderId,
  filterOrders,
  isOrderStatus,
  listStoredOrders,
  saveStoredOrder,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/orders";
import { normalizeIraqMobile } from "@/lib/phone";
import {
  DELIVERY_FEE_IQD,
  getOrderTotal,
  THAHAB_CARRIER,
} from "@/lib/shipping";

export async function GET(req: Request) {
  try {
    const gate = await assertAdminModule("orders");
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "all";
    const q = searchParams.get("q") || "";
    const status: OrderStatus | "all" =
      statusParam === "all" || isOrderStatus(statusParam)
        ? statusParam
        : "all";

    const all = await listStoredOrders();
    const counts = countOrdersByStatus(all);
    const orders = filterOrders(all, { status, q });

    return Response.json({ ok: true, counts, orders });
  } catch (error) {
    console.error("[admin/orders] GET failed", error);
    return Response.json(
      { ok: false, error: "تعذّر تحميل الطلبات." },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  orderId: z.string().min(3),
  status: z.enum([
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
  ]),
  adminNote: z.string().max(500).optional(),
  markReceiptSent: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const gate = await assertAdminModule("orders");
    if (!gate.ok) return gate.response;

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات التحديث غير صحيحة." },
        { status: 400 },
      );
    }

    const updated = await updateOrderStatus(
      parsed.data.orderId,
      parsed.data.status,
      {
        adminNote: parsed.data.adminNote,
        markReceiptSent: parsed.data.markReceiptSent,
      },
    );

    if (!updated) {
      return Response.json(
        { ok: false, error: "الطلب غير موجود." },
        { status: 404 },
      );
    }

    return Response.json({ ok: true, order: updated });
  } catch (error) {
    console.error("[admin/orders] PATCH failed", error);
    return Response.json(
      { ok: false, error: "تعذّر تحديث حالة الطلب." },
      { status: 500 },
    );
  }
}

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(400),
  city: z.string().trim().max(80).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  notes: z.string().trim().max(500).optional(),
  source: z.enum(["instagram", "whatsapp", "website", "other"]),
  paymentMethod: z.enum(["cod", "wayl"]).optional(),
  paymentStatus: z.enum(["paid", "unpaid", "pending"]).optional(),
  deliveryFee: z.number().nonnegative().optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        nameAr: z.string().min(1),
        price: z.number().positive(),
        quantity: z.number().int().positive().max(99),
        size: z.string().optional(),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const gate = await assertAdminModule("orders");
    if (!gate.ok) return gate.response;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "بيانات الطلب اليدوي غير مكتملة أو غير صحيحة." },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const phone = normalizeIraqMobile(data.phone);
    if (!phone) {
      return Response.json(
        {
          ok: false,
          error: "رقم الجوال غير صالح. استخدمي صيغة 07XXXXXXXXX.",
        },
        { status: 400 },
      );
    }

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    if (subtotal <= 0) {
      return Response.json(
        { ok: false, error: "مجموع المنتجات غير صالح." },
        { status: 400 },
      );
    }

    const deliveryFee =
      typeof data.deliveryFee === "number" ? data.deliveryFee : DELIVERY_FEE_IQD;
    const paymentMethod = data.paymentMethod || "cod";
    const paymentMethodLabel =
      paymentMethod === "wayl" ? "الدفع الإلكتروني" : "الدفع عند الاستلام";

    const order: OrderPayload = {
      fullName: data.fullName,
      email:
        data.email && data.email.length > 0
          ? data.email
          : "manual-order@velora.local",
      phone,
      address: data.address,
      city: data.city || undefined,
      country: "العراق",
      paymentMethod,
      paymentMethodLabel,
      paymentStatus: data.paymentStatus || "unpaid",
      notes: data.notes || undefined,
      items: data.items,
      subtotal,
      deliveryFee,
      total: getOrderTotal(subtotal, deliveryFee),
      shippingCarrier: THAHAB_CARRIER.id,
      shippingCarrierLabel: THAHAB_CARRIER.nameAr,
      source: data.source,
      createdByAdminId: gate.actor.subject,
      createdByAdminName: gate.actor.label,
    };

    const orderId = createOrderId();
    const email = buildOrderEmail(order, orderId);
    const sourceNote =
      data.source === "instagram"
        ? "إنستغرام"
        : data.source === "whatsapp"
          ? "واتساب"
          : data.source === "website"
            ? "الموقع"
            : "أخرى";

    const stored = await saveStoredOrder({
      savedAt: new Date().toISOString(),
      orderId,
      subject: email.subject,
      emailedTo: undefined,
      order,
      text: [
        email.text,
        ``,
        `مصدر الطلب: ${sourceNote}`,
        `أضافه الأدمن: ${gate.actor.label}`,
      ].join("\n"),
      status: "new",
      adminNote: `طلب يدوي عبر ${sourceNote} — ${gate.actor.label}`,
    });

    return Response.json({ ok: true, order: stored, orderId });
  } catch (error) {
    console.error("[admin/orders] POST failed", error);
    return Response.json(
      { ok: false, error: "تعذّر إنشاء الطلب اليدوي." },
      { status: 500 },
    );
  }
}
