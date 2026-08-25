import { searchProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** بحث خفيف — يُستدعى عند الكتابة فقط */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return Response.json({ ok: true, products: [] });
  }
  const products = (await searchProducts(q)).slice(0, 24);
  return Response.json({ ok: true, products });
}
