import { z } from "zod";
import { getStoredOrder } from "@/lib/orders";
import { createWaylPaymentLink, isWaylConfigured } from "@/lib/wayl";

const schema = z.object({
  orderId: z.string().min(4).max(64),
});

export async function POST(req: Request) {
  try {
    if (!isWaylConfigured()) {
      return Response.json(
        { ok: false, error: "بوابة Wayl غير مفعّلة بعد." },
        { status: 503 },
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "معرّف الطلب غير صالح." },
        { status: 400 },
      );
    }

    const entry = await getStoredOrder(parsed.data.orderId);
    if (!entry) {
      return Response.json(
        { ok: false, error: "الطلب غير موجود." },
        { status: 404 },
      );
    }

    if (entry.order.paymentMethod !== "wayl") {
      return Response.json(
        { ok: false, error: "هذا الطلب لا يستخدم Wayl." },
        { status: 400 },
      );
    }

    const total =
      entry.order.total ??
      entry.order.subtotal + (entry.order.deliveryFee ?? 0);

    const lineItems = [
      ...entry.order.items.map((item) => ({
        label: `${item.nameAr} × ${item.quantity}`,
        amount: item.price * item.quantity,
      })),
      ...(entry.order.deliveryFee
        ? [{ label: "أجور التوصيل", amount: entry.order.deliveryFee }]
        : []),
    ];

    const link = await createWaylPaymentLink({
      referenceId: entry.orderId,
      total,
      lineItems,
      customParameter: entry.orderId,
    });

    return Response.json({
      ok: true,
      paymentUrl: link.url,
      waylLinkId: link.id,
      referenceId: link.referenceId,
      status: link.status,
    });
  } catch (error) {
    console.error("[payments/wayl/create-link]", error);
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذّر إنشاء رابط الدفع.",
      },
      { status: 500 },
    );
  }
}
