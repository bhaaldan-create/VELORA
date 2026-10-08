import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** Immediate tag expiry for admin-driven storefront updates. */
const REVALIDATE_NOW = { expire: 0 } as const;

type CatalogRevalidateOptions = {
  slug?: string | null;
  oldSlug?: string | null;
};

/** Prefer updateTag (Server Actions); fall back for Route Handler call sites. */
function bustTag(tag: string) {
  try {
    updateTag(tag);
  } catch {
    // updateTag is Server-Action-only; Route Handlers use expire: 0 instead.
  }
  revalidateTag(tag, REVALIDATE_NOW);
}

/** Invalidate storefront catalog + homepage after admin product/home changes. */
export function revalidateStorefront(options: CatalogRevalidateOptions = {}) {
  bustTag(CACHE_TAGS.catalog);
  bustTag(CACHE_TAGS.products);
  bustTag(CACHE_TAGS.categories);
  bustTag(CACHE_TAGS.home);

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/search");
  // Layout covers nested shop URLs; tags cover unstable_cache product lists.
  revalidatePath("/shop", "layout");

  const slug = options.slug?.trim();
  const oldSlug = options.oldSlug?.trim();

  if (slug) {
    bustTag(CACHE_TAGS.product(slug));
    revalidatePath(`/shop/${slug}`);
  }
  if (oldSlug && oldSlug !== slug) {
    bustTag(CACHE_TAGS.product(oldSlug));
    revalidatePath(`/shop/${oldSlug}`);
  }
}

export function revalidateHomepage() {
  bustTag(CACHE_TAGS.home);
  revalidatePath("/");
}
