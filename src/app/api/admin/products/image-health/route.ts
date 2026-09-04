import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImageHealth =
  | "ok"
  | "missing"
  | "data-url"
  | "local-path"
  | "remote-url"
  | "empty";

function classify(stored: string | null | undefined): ImageHealth {
  if (!stored?.trim()) return "empty";
  const url = stored.trim();
  if (url.startsWith("data:")) return "data-url";
  if (url.startsWith("https://") || url.startsWith("http://")) return "remote-url";
  if (
    url.startsWith("/uploads/") ||
    url.startsWith("/products/") ||
    url.startsWith("/brands/") ||
    url.startsWith("/brand/")
  ) {
    return "local-path";
  }
  return "missing";
}

/**
 * Admin diagnostic: classify product image storage without downloading bytes.
 * GET /api/admin/products/image-health
 */
export async function GET() {
  try {
    const rows = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        nameAr: true,
        isActive: true,
        imageUrl: true,
        brandLogoUrl: true,
      },
      orderBy: { nameAr: "asc" },
    });

    const products = rows.map((row) => {
      const image = classify(row.imageUrl);
      const brandLogo = classify(row.brandLogoUrl);
      const ok =
        (image === "remote-url" || image === "local-path" || image === "data-url") &&
        (brandLogo === "empty" ||
          brandLogo === "remote-url" ||
          brandLogo === "local-path" ||
          brandLogo === "data-url");
      return {
        id: row.id,
        slug: row.slug,
        nameAr: row.nameAr,
        isActive: row.isActive,
        image,
        brandLogo,
        status: ok ? ("ok" as const) : ("needs-attention" as const),
        note:
          image === "data-url" || brandLogo === "data-url"
            ? "مخزّنة كـ data URL — أضيفي BLOB_READ_WRITE_TOKEN ثم أعيدي رفع الصورة"
            : image === "empty"
              ? "بدون صورة منتج"
              : null,
      };
    });

    const summary = {
      total: products.length,
      ok: products.filter((p) => p.status === "ok" && p.image !== "empty").length,
      empty: products.filter((p) => p.image === "empty").length,
      dataUrl: products.filter(
        (p) => p.image === "data-url" || p.brandLogo === "data-url",
      ).length,
      remote: products.filter((p) => p.image === "remote-url").length,
      localPath: products.filter((p) => p.image === "local-path").length,
    };

    return Response.json({ ok: true, summary, products });
  } catch (error) {
    console.error("[admin/products/image-health]", error);
    return Response.json(
      { ok: false, error: "تعذّر فحص صحة الصور." },
      { status: 500 },
    );
  }
}
