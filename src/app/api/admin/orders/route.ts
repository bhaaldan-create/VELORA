import { z } from "zod";
import {
  countOrdersByStatus,
  filterOrders,
  isOrderStatus,
  listStoredOrders,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/orders";

export async function GET(req: Request) {
  try {
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
  status: z.enum(["new", "preparing", "delivered"]),
  adminNote: z.string().max(500).optional(),
  markReceiptSent: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
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
