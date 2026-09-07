import { getCatalogFacets } from "@/lib/catalog-search";
import { MEDIA_CACHE_CONTROL, MEDIA_CDN_CACHE_CONTROL } from "@/lib/media-cache";

export const revalidate = 3600;

/** Facet values derived from active catalog (no invented data). */
export async function GET() {
  try {
    const facets = await getCatalogFacets();
    return Response.json(
      { ok: true, facets },
      {
        headers: {
          "Cache-Control": MEDIA_CACHE_CONTROL,
          "CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
          "Vercel-CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
        },
      },
    );
  } catch (error) {
    console.error("[catalog/facets]", error);
    return Response.json({ ok: false, error: "Facets failed" }, { status: 500 });
  }
}
