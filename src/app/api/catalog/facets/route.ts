import { getCatalogFacets } from "@/lib/catalog-search";

export const dynamic = "force-dynamic";

/** Facet values derived from active catalog (no invented data). */
export async function GET() {
  try {
    const facets = await getCatalogFacets();
    return Response.json({ ok: true, facets });
  } catch (error) {
    console.error("[catalog/facets]", error);
    return Response.json({ ok: false, error: "Facets failed" }, { status: 500 });
  }
}
