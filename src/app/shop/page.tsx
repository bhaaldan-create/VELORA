import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { getAllCategories, getAllProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "التسوق",
  description:
    "تسوّقي من VELORA العناية بالبشرة والجسم والشعر والمكياج — بأسعار الدينار العراقي.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <ShopCatalog
        initialCategory={category}
        products={products}
        categories={categories}
      />
    </div>
  );
}
