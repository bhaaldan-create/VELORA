import {
  isWaylPaidPayload,
  verifyWaylWebhookSignature,
} from "@/lib/wayl";
import { markOrderPaidByWayl } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** تأكيد الدفع من Wayl — يجب قراءة الجسم الخام كما وصل */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-wayl-signature-256") ||
      req.headers.get("X-WAYL-SIGNATURE-256");

    if (!verifyWaylWebhookSignature(rawBody, signature)) {
      console.warn("[payments/wayl/webhook] invalid signature");
      return Response.json({ ok: false, error: "توقيع غير صالح." }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return Response.json({ ok: false, error: "جسم غير صالح." }, { status: 400 });
    }

    const referenceId = String(
      payload.referenceId ?? payload.reference_id ?? "",
    ).trim();
    if (!referenceId) {
      return Response.json({ ok: false, error: "referenceId مفقود." }, { status: 400 });
    }

    if (!isWaylPaidPayload(payload)) {
      return Response.json({ ok: true, ignored: true, referenceId });
    }

    const waylLinkId = String(payload.id ?? payload.linkId ?? "").trim() || undefined;
    const eventId = String(payload.eventId ?? payload.id ?? "").trim() || undefined;

    const updated = await markOrderPaidByWayl(referenceId, {
      waylLinkId,
      waylEventId: eventId,
    });

    if (!updated) {
      return Response.json(
        { ok: false, error: "الطلب غير موجود." },
        { status: 404 },
      );
    }

    return Response.json({ ok: true, orderId: referenceId, paid: true });
  } catch (error) {
    console.error("[payments/wayl/webhook]", error);
    return Response.json(
      { ok: false, error: "تعذّر معالجة Webhook." },
      { status: 500 },
    );
  }
}
