import { suggestCatalog } from "@/lib/catalog-search";
import { popularSearches } from "@/data/popular-searches";

export const dynamic = "force-dynamic";

/** Live search suggestions: products, brands, categories + popular list. */
export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    const suggestions = await suggestCatalog(q);
    return Response.json({
      ok: true,
      ...suggestions,
      popular: popularSearches,
    });
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
