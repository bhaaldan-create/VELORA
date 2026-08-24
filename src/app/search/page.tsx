import type { Metadata } from "next";
import { SearchScreen } from "@/components/shop/SearchScreen";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";

export const metadata: Metadata = {
  title: "البحث",
  description: "ابحثي في منتجات وبراندات VELORA.",
};

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <SearchScreen />
    </div>
  );
}
