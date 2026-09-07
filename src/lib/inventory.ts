import type { Product } from "@/types";

/** Storefront + cart: product stays visible; add-to-bag only when stock > 0. */
export function isProductInStock(
  product: Pick<Product, "stock"> | { stock?: number | null },
): boolean {
  return (product.stock ?? 1) > 0;
}

export function soldOutLabel(locale: string): string {
  return locale === "en" ? "Sold out" : "نفذ";
}
