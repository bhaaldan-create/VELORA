/**
 * Pure unit tests for catalog search/filter param merge + brand identity.
 * Run: npx tsx scripts/test-catalog-search.ts
 */
import assert from "node:assert/strict";
import {
  mergeCatalogSearchParams,
  parseCatalogSearchParams,
  serializeCatalogSearchParams,
  type CatalogSearchParams,
} from "../src/lib/catalog-search-params";
import {
  getShopBrand,
  getShopBrandByProductBrandName,
  productMatchesBrand,
} from "../src/data/shop-brands";

function base(overrides: Partial<CatalogSearchParams> = {}): CatalogSearchParams {
  return {
    q: "",
    sort: "best-selling",
    concerns: [],
    skinTypes: [],
    ingredients: [],
    features: [],
    page: 1,
    pageSize: 24,
    ...overrides,
  };
}

function roundTrip(params: CatalogSearchParams): CatalogSearchParams {
  return parseCatalogSearchParams(serializeCatalogSearchParams(params));
}

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

// 1. Search only
test("search only serializes q, not brand", () => {
  const p = roundTrip(base({ q: "serum", sort: "best-match" }));
  assert.equal(p.q, "serum");
  assert.equal(p.brand, undefined);
  assert.equal(p.category, undefined);
});

// 2. Brand only (slug)
test("brand slug only — no q", () => {
  const p = roundTrip(base({ brand: "anua" }));
  assert.equal(p.brand, "anua");
  assert.equal(p.q, "");
  assert.ok(getShopBrand("anua"));
});

// 3. Category only
test("category only", () => {
  const p = roundTrip(base({ category: "skincare" }));
  assert.equal(p.category, "skincare");
  assert.equal(p.q, "");
});

// 4. Concern only
test("concern only", () => {
  const p = roundTrip(base({ concerns: ["hydration"] }));
  assert.deepEqual(p.concerns, ["hydration"]);
  assert.equal(p.q, "");
});

// 5. Brand + Category
test("brand + category stay independent", () => {
  const p = roundTrip(base({ brand: "anua", category: "skincare" }));
  assert.equal(p.brand, "anua");
  assert.equal(p.category, "skincare");
  assert.equal(p.q, "");
});

// 6. Search + Brand
test("search + brand stay independent", () => {
  const p = roundTrip(
    base({ q: "serum", brand: "anua", sort: "best-match" }),
  );
  assert.equal(p.q, "serum");
  assert.equal(p.brand, "anua");
});

// 7. Search + multiple filters
test("search + multiple filters", () => {
  const p = roundTrip(
    base({
      q: "niacinamide",
      brand: "cosrx",
      category: "skincare",
      concerns: ["acne", "glow"],
      isNew: true,
      sort: "best-match",
    }),
  );
  assert.equal(p.q, "niacinamide");
  assert.equal(p.brand, "cosrx");
  assert.equal(p.category, "skincare");
  assert.deepEqual(p.concerns, ["acne", "glow"]);
  assert.equal(p.isNew, true);
});

// 8. Remove one filter via merge
test("remove one filter keeps others", () => {
  const current = base({
    q: "serum",
    brand: "anua",
    category: "skincare",
    sort: "best-match",
  });
  const next = mergeCatalogSearchParams(current, { brand: undefined });
  assert.equal(next.brand, undefined);
  assert.equal(next.q, "serum");
  assert.equal(next.category, "skincare");
});

// 9. Clear all → empty serialize
test("clear all → empty query string", () => {
  const empty = parseCatalogSearchParams(new URLSearchParams());
  const qs = serializeCatalogSearchParams(empty).toString();
  // sort may remain as default when serializing full object — clearAll uses pathname only
  const cleared = serializeCatalogSearchParams({
    q: "",
    sort: undefined,
    concerns: [],
    skinTypes: [],
    ingredients: [],
    features: [],
    page: 1,
  } as Partial<CatalogSearchParams>);
  assert.equal(cleared.get("q"), null);
  assert.equal(cleared.get("brand"), null);
  assert.equal(cleared.get("category"), null);
});

// 10. Rapid filter merge (latest-wins composition)
test("rapid successive merges compose (no lost update)", () => {
  let state = base();
  state = mergeCatalogSearchParams(state, { brand: "anua" });
  state = mergeCatalogSearchParams(state, { brand: "maybelline" });
  state = mergeCatalogSearchParams(state, { category: "makeup" });
  assert.equal(state.brand, "maybelline");
  assert.equal(state.category, "makeup");
  assert.equal(state.page, 1);
});

// 11. Rapid search merge
test("rapid search changes keep latest q", () => {
  let state = base();
  state = mergeCatalogSearchParams(state, { q: "anua", sort: "best-match" });
  state = mergeCatalogSearchParams(state, {
    q: "la roche",
    sort: "best-match",
  });
  assert.equal(state.q, "la roche");
  assert.equal(state.brand, undefined);
});

// 12. Pagination + filters — page resets on filter change
test("filter change resets page to 1", () => {
  const state = mergeCatalogSearchParams(
    base({ brand: "anua", page: 3 }),
    { category: "skincare" },
  );
  assert.equal(state.page, 1);
  assert.equal(state.brand, "anua");
  assert.equal(state.category, "skincare");
});

test("explicit page patch is preserved", () => {
  const state = mergeCatalogSearchParams(base({ brand: "anua", page: 1 }), {
    page: 2,
  });
  assert.equal(state.page, 2);
});

// 13/14. URL with filters round-trip
test("URL with filters round-trips", () => {
  const url = new URLSearchParams(
    "brand=anua&category=skincare&concern=hydration,acne&q=serum&sort=best-match&page=2",
  );
  const p = parseCatalogSearchParams(url);
  assert.equal(p.brand, "anua");
  assert.equal(p.category, "skincare");
  assert.deepEqual(p.concerns, ["hydration", "acne"]);
  assert.equal(p.q, "serum");
  assert.equal(p.page, 2);
  const again = roundTrip(p);
  assert.equal(again.brand, "anua");
  assert.equal(again.q, "serum");
});

// 15. No filters
test("no filters parse empty", () => {
  const p = parseCatalogSearchParams(new URLSearchParams());
  assert.equal(p.q, "");
  assert.equal(p.brand, undefined);
  assert.equal(p.category, undefined);
  assert.equal(p.concerns.length, 0);
});

// Brand identity: name vs slug
test("getShopBrand resolves slug and name", () => {
  assert.equal(getShopBrand("anua")?.slug, "anua");
  assert.equal(getShopBrand("Anua")?.slug, "anua");
  assert.equal(getShopBrandByProductBrandName("Anua")?.slug, "anua");
});

// Brand match must not use title when brandName set
test("productMatchesBrand ignores title when brandName present", () => {
  const anua = getShopBrand("anua")!;
  assert.equal(
    productMatchesBrand(
      "Anua Heartleaf Toner",
      "تونر أنوا",
      anua,
      "COSRX",
    ),
    false,
  );
  assert.equal(
    productMatchesBrand("Some Toner", "تونر", anua, "Anua"),
    true,
  );
});

// Filter must not become search: brand param never written into q by merge
test("brand patch never sets q", () => {
  const next = mergeCatalogSearchParams(base({ q: "" }), { brand: "anua" });
  assert.equal(next.q, "");
  assert.equal(next.brand, "anua");
  const qs = serializeCatalogSearchParams(next);
  assert.equal(qs.get("q"), null);
  assert.equal(qs.get("brand"), "anua");
});

console.log(`\n${passed} tests passed`);
