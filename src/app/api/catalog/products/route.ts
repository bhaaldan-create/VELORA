import { getAllProducts } from "@/lib/catalog";
import {
  CATALOG_CACHE_CONTROL,
  CATALOG_CDN_CACHE_CONTROL,
} from "@/lib/media-cache";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

/** قائمة خفيفة للتسوق — تُحمَّل بعد عرض الصفحة */
export async function GET() {
  const products = await getAllProducts();
  return Response.json(
    { ok: true, products },
    {
      headers: {
        "Cache-Control": CATALOG_CACHE_CONTROL,
        "CDN-Cache-Control": CATALOG_CDN_CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": CATALOG_CDN_CACHE_CONTROL,
      },
    },
  );
}
