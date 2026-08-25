import { getAllProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** قائمة خفيفة للتسوق — تُحمَّل بعد عرض الصفحة */
export async function GET() {
  const products = await getAllProducts();
  return Response.json({ ok: true, products });
}
