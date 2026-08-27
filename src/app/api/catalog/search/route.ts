import {
  parseCatalogSearchParams,
  searchCatalog,
} from "@/lib/catalog-search";

export const dynamic = "force-dynamic";

/**
 * Advanced catalog search.
 * Backward compatible: GET ?q=serum still works.
 * Also accepts filter/sort/page params from shared engine.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = parseCatalogSearchParams(url.searchParams);

    // Preserve old empty-q behavior for bare suggest-style clients:
    // if nothing to search/filter, return empty products list.
    const hasFilters =
      !!params.q ||
      !!params.category ||
      !!params.productType ||
      !!params.brand ||
      params.minPrice != null ||
      params.maxPrice != null ||
      params.inStock ||
      params.concerns.length > 0 ||
      params.skinTypes.length > 0 ||
      params.ingredients.length > 0 ||
      params.features.length > 0 ||
      params.ratingMin != null ||
      params.onSale ||
      params.isNew ||
      params.isBestseller ||
      !!params.origin ||
      url.searchParams.has("sort");

    if (!hasFilters) {
      return Response.json({
        ok: true,
        products: [],
        total: 0,
        page: 1,
        pageSize: params.pageSize,
        sort: params.sort,
      });
    }

    const result = await searchCatalog(params);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("[catalog/search]", error);
    return Response.json(
      { ok: false, error: "Search failed", products: [], total: 0 },
      { status: 500 },
    );
  }
}
