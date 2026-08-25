import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { getAllCategories, getAllProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "التسوق",
  description:
    "تسوّقي من VELORA — تمرير سريع على العناية والمكياج بأسعار الدينار العراقي.",
};

/** Dynamic: avoid embedding huge base64 blobs in a static ISR payload. */
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);

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
