import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** Immediate tag expiry for admin-driven storefront updates. */
const REVALIDATE_NOW = { expire: 0 } as const;

type CatalogRevalidateOptions = {
  slug?: string | null;
  oldSlug?: string | null;
};

/** Invalidate storefront catalog + homepage after admin product/home changes. */
export function revalidateStorefront(options: CatalogRevalidateOptions = {}) {
  revalidateTag(CACHE_TAGS.catalog, REVALIDATE_NOW);
  revalidateTag(CACHE_TAGS.products, REVALIDATE_NOW);
  revalidateTag(CACHE_TAGS.categories, REVALIDATE_NOW);

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/search");

  const slug = options.slug?.trim();
  const oldSlug = options.oldSlug?.trim();

  if (slug) {
    revalidateTag(CACHE_TAGS.product(slug), REVALIDATE_NOW);
    revalidatePath(`/shop/${slug}`);
  }
  if (oldSlug && oldSlug !== slug) {
    revalidateTag(CACHE_TAGS.product(oldSlug), REVALIDATE_NOW);
    revalidatePath(`/shop/${oldSlug}`);
  }
}

export function revalidateHomepage() {
  revalidateTag(CACHE_TAGS.home, REVALIDATE_NOW);
  revalidatePath("/");
}
