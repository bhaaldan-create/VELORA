import { z } from "zod";
import { assertAdminModule } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/finance/audit";
import { receiveImportShipment } from "@/lib/finance/imports";
import { toIqd } from "@/lib/finance/product-cost";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await assertAdminModule("imports");
  if (!gate.ok) return gate.response;

  const shipments = await prisma.importShipment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, nameAr: true, slug: true } },
        },
      },
    },
    take: 100,
  });
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, nameAr: true, slug: true },
    orderBy: { nameAr: "asc" },
  });
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    select: { id: true, name: true, currency: true },
    orderBy: { name: "asc" },
  });
  return Response.json({ ok: true, shipments, products, suppliers });
}

const createSchema = z.object({
  action: z.literal("create"),
  code: z.string().min(1).max(40),
  supplierId: z.string().nullable().optional(),
  currency: z.string().default("USD"),
  exchangeRate: z.number().positive(),
  purchaseDate: z.string().optional(),
  shippingCost: z.number().nonnegative().optional(),
  customsCost: z.number().nonnegative().optional(),
  brokerageCost: z.number().nonnegative().optional(),
  otherFees: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const addItemSchema = z.object({
  action: z.literal("addItem"),
  shipmentId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitCost: z.number().nonnegative(),
});

const receiveSchema = z.object({
  action: z.literal("receive"),
  shipmentId: z.string().min(1),
});

export async function POST(req: Request) {
  const gate = await assertAdminModule("imports");
  if (!gate.ok) return gate.response;

  const body = await req.json();
  const action = body?.action;

  try {
    if (action === "create") {
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ ok: false, error: "بيانات الشحنة غير صالحة" }, { status: 400 });
      }
      const d = parsed.data;
      const shipping = d.shippingCost || 0;
      const customs = d.customsCost || 0;
      const brokerage = d.brokerageCost || 0;
      const other = d.otherFees || 0;
      const shipment = await prisma.importShipment.create({
        data: {
          code: d.code.trim(),
          supplierId: d.supplierId || null,
          currency: d.currency,
          exchangeRate: d.exchangeRate,
          purchaseDate: d.purchaseDate || "",
          shippingCost: shipping,
          customsCost: customs,
          brokerageCost: brokerage,
          otherFees: other,
          totalLandedIqd: toIqd(
            shipping + customs + brokerage + other,
            d.currency,
            d.exchangeRate,
          ),
          notes: d.notes || "",
          status: "Ordered",
        },
      });
      await writeAuditLog({
        actorId: gate.actor.subject,
        actorLabel: gate.actor.label,
        action: "import.create",
        entityType: "ImportShipment",
        entityId: shipment.id,
        after: shipment,
      });
      return Response.json({ ok: true, shipment }, { status: 201 });
    }

    if (action === "addItem") {
      const parsed = addItemSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ ok: false, error: "بيانات الصنف غير صالحة" }, { status: 400 });
      }
      const d = parsed.data;
      const shipment = await prisma.importShipment.findUnique({
        where: { id: d.shipmentId },
        include: { items: true },
      });
      if (!shipment) {
        return Response.json({ ok: false, error: "الشحنة غير موجودة" }, { status: 404 });
      }
      if (shipment.status === "Received" || shipment.status === "Completed") {
        return Response.json({ ok: false, error: "لا يمكن تعديل شحنة مستلمة" }, { status: 400 });
      }
      const item = await prisma.importItem.create({
        data: {
          shipmentId: d.shipmentId,
          productId: d.productId,
          quantity: d.quantity,
          unitCost: d.unitCost,
        },
      });
      const purchaseTotal =
        shipment.items.reduce((s, i) => s + i.unitCost * i.quantity, 0) +
        d.unitCost * d.quantity;
      const extras =
        shipment.shippingCost +
        shipment.customsCost +
        shipment.brokerageCost +
        shipment.otherFees;
      await prisma.importShipment.update({
        where: { id: d.shipmentId },
        data: {
          purchaseTotal,
          totalLandedIqd: toIqd(
            purchaseTotal + extras,
            shipment.currency,
            shipment.exchangeRate,
          ),
        },
      });
      return Response.json({ ok: true, item });
    }

    if (action === "receive") {
      const parsed = receiveSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ ok: false, error: "shipmentId مطلوب" }, { status: 400 });
      }
      const result = await receiveImportShipment(
        parsed.data.shipmentId,
        gate.actor.subject,
      );
      return Response.json({ ok: true, ...result });
    }

    return Response.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل العملية";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
