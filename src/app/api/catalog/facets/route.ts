import { getCatalogFacets } from "@/lib/catalog-search";
import {
  CATALOG_CACHE_CONTROL,
  CATALOG_CDN_CACHE_CONTROL,
} from "@/lib/media-cache";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

/** Facet values derived from active catalog (no invented data). */
export async function GET() {
  try {
    const facets = await getCatalogFacets();
    return Response.json(
      { ok: true, facets },
      {
        headers: {
          "Cache-Control": CATALOG_CACHE_CONTROL,
          "CDN-Cache-Control": CATALOG_CDN_CACHE_CONTROL,
          "Vercel-CDN-Cache-Control": CATALOG_CDN_CACHE_CONTROL,
        },
      },
    );
  } catch (error) {
    console.error("[catalog/facets]", error);
    return Response.json({ ok: false, error: "Facets failed" }, { status: 500 });
  }
}
