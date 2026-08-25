import type { Metadata } from "next";
import { SearchScreen } from "@/components/shop/SearchScreen";

export const metadata: Metadata = {
  title: "البحث",
  description: "ابحثي في منتجات وبراندات VELORA.",
};

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <SearchScreen />
    </div>
  );
}
