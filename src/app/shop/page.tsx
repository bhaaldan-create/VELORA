import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { getAllCategories, getAllProducts } from "@/lib/catalog";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";

export const metadata: Metadata = {
  title: "التسوق",
  description:
    "تسوّقي من VELORA — تمرير سريع على العناية والمكياج بأسعار الدينار العراقي.",
};

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string }>;
}) {
  const { category, brand } = await searchParams;
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <ShopCatalog
        initialCategory={category}
        initialBrand={brand}
        products={products}
        categories={categories}
      />
    </div>
  );
}
