import type { Metadata } from "next";
import { SearchScreen } from "@/components/shop/SearchScreen";
import { getAllProducts } from "@/lib/catalog";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";

export const metadata: Metadata = {
  title: "البحث",
  description: "ابحثي في منتجات وبراندات VELORA.",
};

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

export default async function SearchPage() {
  const products = await getAllProducts();

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <SearchScreen products={products} />
    </div>
  );
}
