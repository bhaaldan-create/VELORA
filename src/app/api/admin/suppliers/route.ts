import { z } from "zod";
import { assertAdminModule } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/finance/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await assertAdminModule("suppliers");
  if (!gate.ok) return gate.response;
  const suppliers = await prisma.supplier.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  return Response.json({ ok: true, suppliers });
}

const upsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  country: z.string().max(120).optional(),
  website: z.string().max(500).optional(),
  catalogUrl: z.string().max(500).optional(),
  contactName: z.string().max(120).optional(),
  contactPhone: z.string().max(60).optional(),
  contactEmail: z.string().max(160).optional(),
  whatsappUrl: z.string().max(500).optional(),
  instagramUrl: z.string().max(500).optional(),
  alibabaUrl: z.string().max(500).optional(),
  currency: z.string().max(8).optional(),
  paymentTerms: z.string().max(200).optional(),
  shippingMethod: z.string().max(120).optional(),
  reliabilityRating: z.number().int().min(1).max(5).optional(),
  avgDeliveryDays: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(req: Request) {
  const gate = await assertAdminModule("suppliers");
  if (!gate.ok) return gate.response;
  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
  }
  const d = parsed.data;
  const supplier = await prisma.supplier.create({
    data: {
      name: d.name.trim(),
      country: d.country || "",
      website: d.website || "",
      catalogUrl: d.catalogUrl || "",
      contactName: d.contactName || "",
      contactPhone: d.contactPhone || "",
      contactEmail: d.contactEmail || "",
      whatsappUrl: d.whatsappUrl || "",
      instagramUrl: d.instagramUrl || "",
      alibabaUrl: d.alibabaUrl || "",
      currency: d.currency || "USD",
      paymentTerms: d.paymentTerms || "",
      shippingMethod: d.shippingMethod || "",
      reliabilityRating: d.reliabilityRating ?? 3,
      avgDeliveryDays: d.avgDeliveryDays ?? 0,
      notes: d.notes || "",
      isActive: d.isActive !== false,
    },
  });
  await writeAuditLog({
    actorId: gate.actor.subject,
    actorLabel: gate.actor.label,
    action: "supplier.create",
    entityType: "Supplier",
    entityId: supplier.id,
    after: supplier,
  });
  return Response.json({ ok: true, supplier }, { status: 201 });
}

export async function PATCH(req: Request) {
  const gate = await assertAdminModule("suppliers");
  if (!gate.ok) return gate.response;
  const body = await req.json();
  const parsed = upsertSchema.extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
  }
  const { id, ...rest } = parsed.data;
  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(rest.name ? { name: rest.name.trim() } : {}),
      ...(rest.country !== undefined ? { country: rest.country } : {}),
      ...(rest.website !== undefined ? { website: rest.website } : {}),
      ...(rest.catalogUrl !== undefined ? { catalogUrl: rest.catalogUrl } : {}),
      ...(rest.contactName !== undefined ? { contactName: rest.contactName } : {}),
      ...(rest.contactPhone !== undefined ? { contactPhone: rest.contactPhone } : {}),
      ...(rest.contactEmail !== undefined ? { contactEmail: rest.contactEmail } : {}),
      ...(rest.whatsappUrl !== undefined ? { whatsappUrl: rest.whatsappUrl } : {}),
      ...(rest.instagramUrl !== undefined ? { instagramUrl: rest.instagramUrl } : {}),
      ...(rest.alibabaUrl !== undefined ? { alibabaUrl: rest.alibabaUrl } : {}),
      ...(rest.currency !== undefined ? { currency: rest.currency } : {}),
      ...(rest.paymentTerms !== undefined ? { paymentTerms: rest.paymentTerms } : {}),
      ...(rest.shippingMethod !== undefined ? { shippingMethod: rest.shippingMethod } : {}),
      ...(rest.reliabilityRating !== undefined
        ? { reliabilityRating: rest.reliabilityRating }
        : {}),
      ...(rest.avgDeliveryDays !== undefined
        ? { avgDeliveryDays: rest.avgDeliveryDays }
        : {}),
      ...(rest.notes !== undefined ? { notes: rest.notes } : {}),
      ...(rest.isActive !== undefined ? { isActive: rest.isActive } : {}),
    },
  });
  await writeAuditLog({
    actorId: gate.actor.subject,
    actorLabel: gate.actor.label,
    action: "supplier.update",
    entityType: "Supplier",
    entityId: id,
    after: supplier,
  });
  return Response.json({ ok: true, supplier });
}

export async function DELETE(req: Request) {
  const gate = await assertAdminModule("suppliers");
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "id مطلوب" }, { status: 400 });
  }
  await prisma.supplier.delete({ where: { id } });
  await writeAuditLog({
    actorId: gate.actor.subject,
    actorLabel: gate.actor.label,
    action: "supplier.delete",
    entityType: "Supplier",
    entityId: id,
  });
  return Response.json({ ok: true });
}
