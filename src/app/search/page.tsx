import type { Metadata } from "next";
import { SearchScreen } from "@/components/shop/SearchScreen";

export const metadata: Metadata = {
  title: "البراندات",
  description: "تسوّقي من أفضل العلامات التجارية العالمية في VELORA.",
};

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="relative isolate min-h-[70vh] overflow-hidden bg-[#FBF8F7]">
      {/* Soft glass orbs — edges only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -start-24 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(186,168,198,0.28),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-28 top-24 h-80 w-80 rounded-[42%] bg-[radial-gradient(circle,rgba(168,140,170,0.22),transparent_68%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -start-10 h-64 w-64 rotate-12 rounded-[40%] bg-[radial-gradient(circle,rgba(179,155,192,0.2),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -end-16 h-72 w-72 -rotate-6 rounded-[45%] bg-[radial-gradient(circle,rgba(158,130,168,0.18),transparent_68%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-32 start-[8%] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(220,205,225,0.35),transparent_70%)] blur-xl opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-40 end-[10%] h-36 w-44 rounded-[48%] bg-[radial-gradient(circle,rgba(205,188,210,0.28),transparent_70%)] blur-xl opacity-60"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-8 sm:py-12 sm:pb-32">
        <SearchScreen />
      </div>
    </div>
  );
}
