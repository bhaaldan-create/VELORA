import { getAllProducts } from "@/lib/catalog";

export const revalidate = 3600;

/** قائمة خفيفة للتسوق — تُحمَّل بعد عرض الصفحة */
export async function GET() {
  const products = await getAllProducts();
  return Response.json({ ok: true, products });
}
