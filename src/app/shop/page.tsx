import { Suspense } from "react";
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

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-3xl bg-[var(--mist)]" />
        }
      >
        <ShopCatalog products={products} categories={categories} />
      </Suspense>
    </div>
  );
}
