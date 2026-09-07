import { suggestCatalog } from "@/lib/catalog-search";
import { popularSearches } from "@/data/popular-searches";
import { MEDIA_CACHE_CONTROL, MEDIA_CDN_CACHE_CONTROL } from "@/lib/media-cache";

export const revalidate = 3600;

/** Live search suggestions: products, brands, categories + popular list. */
export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    const suggestions = await suggestCatalog(q);
    return Response.json(
      {
        ok: true,
        ...suggestions,
        popular: popularSearches,
      },
      {
        headers: {
          "Cache-Control": MEDIA_CACHE_CONTROL,
          "CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
          "Vercel-CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
        },
      },
    );
  } catch (error) {
    console.error("[catalog/suggest]", error);
    return Response.json(
      {
        ok: false,
        products: [],
        brands: [],
        categories: [],
        popular: popularSearches,
      },
      { status: 500 },
    );
  }
}
