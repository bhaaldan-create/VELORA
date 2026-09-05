import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { getAllCategories, getProductsByCategory } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "التسوق",
  description:
    "تسوّقي من VELORA — تمرير سريع على العناية والمكياج بأسعار الدينار العراقي.",
};

/** Short ISR — card payloads no longer embed image blobs. */
export const revalidate = 60;

export default async function ShopPage() {
  const categories = await getAllCategories();
  // Rails only need ~12 items/category — avoid shipping the full catalog into RSC.
  const perCategory = await Promise.all(
    categories.map((cat) => getProductsByCategory(cat.slug, 16)),
  );
  const products = perCategory.flat();

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-3xl bg-[var(--mist)]" />
        }
      >
        <ShopCatalog categories={categories} products={products} />
      </Suspense>
    </div>
  );
}
