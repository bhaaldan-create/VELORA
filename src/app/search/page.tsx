import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchScreen } from "@/components/shop/SearchScreen";

export const metadata: Metadata = {
  title: "البحث",
  description: "اكتشفِ منتجات وماركات VELORA — بحث وفلاتر ذكية.",
};

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="relative isolate min-h-[70vh] overflow-hidden bg-[var(--background)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -start-24 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(186,168,198,0.28),transparent_70%)] blur-2xl [[data-theme=dark]_&]:opacity-25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-28 top-24 h-80 w-80 rounded-[42%] bg-[radial-gradient(circle,rgba(168,140,170,0.22),transparent_68%)] blur-3xl [[data-theme=dark]_&]:opacity-20"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-8 sm:py-12 sm:pb-32">
        <Suspense
          fallback={
            <p className="py-16 text-center text-[0.9rem] text-[var(--muted)]">
              …
            </p>
          }
        >
          <SearchScreen />
        </Suspense>
      </div>
    </div>
  );
}
