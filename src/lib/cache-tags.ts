/** Cache tags for Next.js data cache + on-demand revalidation. */
export const CACHE_TAGS = {
  catalog: "velora-catalog",
  products: "velora-products",
  categories: "velora-categories",
  home: "velora-home",
  product: (slug: string) => `velora-product:${slug}`,
} as const;

/** Fallback ISR / data-cache TTL when admin has not triggered revalidation. */
export const STOREFRONT_REVALIDATE_SECONDS = 3600;
