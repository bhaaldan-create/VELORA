import { getAllProducts } from "@/lib/catalog";
import { MEDIA_CACHE_CONTROL, MEDIA_CDN_CACHE_CONTROL } from "@/lib/media-cache";

export const revalidate = 3600;

/** قائمة خفيفة للتسوق — تُحمَّل بعد عرض الصفحة */
export async function GET() {
  const products = await getAllProducts();
  return Response.json(
    { ok: true, products },
    {
      headers: {
        "Cache-Control": MEDIA_CACHE_CONTROL,
        "CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
      },
    },
  );
}
