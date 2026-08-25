import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/finance/audit";

export const dynamic = "force-dynamic";

function slugify(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff\s-]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `brand-${Date.now().toString(36)}`
  );
}

export async function GET() {
  const brands = await prisma.brandProfile.findMany({
    orderBy: { name: "asc" },
    include: { supplier: { select: { id: true, name: true } } },
  });
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return Response.json({ ok: true, brands, suppliers });
}

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(160),
  countryOfOrigin: z.string().optional(),
  officialWebsite: z.string().optional(),
  supplierId: z.string().nullable().optional(),
  sourceCountry: z.string().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
  }
  const d = parsed.data;
  const base = slugify(d.name);
  let slug = base;
  let n = 2;
  while (await prisma.brandProfile.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  const brand = await prisma.brandProfile.create({
    data: {
      name: d.name.trim(),
      slug,
      countryOfOrigin: d.countryOfOrigin || "",
      officialWebsite: d.officialWebsite || "",
      supplierId: d.supplierId || null,
      sourceCountry: d.sourceCountry || "",
      currency: d.currency || "USD",
      notes: d.notes || "",
    },
  });
  await writeAuditLog({
    action: "brand.create",
    entityType: "BrandProfile",
    entityId: brand.id,
    after: brand,
  });
  return Response.json({ ok: true, brand }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const parsed = schema.extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
  }
  const { id, ...d } = parsed.data;
  const brand = await prisma.brandProfile.update({
    where: { id },
    data: {
      name: d.name.trim(),
      countryOfOrigin: d.countryOfOrigin || "",
      officialWebsite: d.officialWebsite || "",
      supplierId: d.supplierId || null,
      sourceCountry: d.sourceCountry || "",
      currency: d.currency || "USD",
      notes: d.notes || "",
    },
  });
  return Response.json({ ok: true, brand });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return Response.json({ ok: false, error: "id مطلوب" }, { status: 400 });
  }
  await prisma.brandProfile.delete({ where: { id } });
  return Response.json({ ok: true });
}
