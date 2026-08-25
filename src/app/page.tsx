import { Suspense } from "react";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { Hero } from "@/components/home/Hero";
import { LarsaHomeBar } from "@/components/home/LarsaHomeBar";
import { ProductRail } from "@/components/home/ProductRail";
import { PromoBanner } from "@/components/home/PromoBanner";
import { ContactHelpCard } from "@/components/contact/ContactHelpCard";
import { GlobalOrigins } from "@/components/home/GlobalOrigins";
import { getBestsellers, getNewArrivals } from "@/lib/catalog";
import {
  getHomeCategoryConfigForStorefront,
  getHomeHeroConfigForStorefront,
} from "@/lib/home/config";
import { getHomePromoConfigForStorefront } from "@/lib/home/promo-config";

export const revalidate = 3600;

async function HomeAboveFold() {
  const [heroConfig, categoryConfig, promoConfig] = await Promise.all([
    getHomeHeroConfigForStorefront(),
    getHomeCategoryConfigForStorefront(),
    getHomePromoConfigForStorefront(),
  ]);

  return (
    <>
      <Hero config={heroConfig} />
      <LarsaHomeBar />
      <CategoryShowcase cards={categoryConfig.cards} />
      <PromoBanner config={promoConfig} />
    </>
  );
}

async function HomeProductRails() {
  const [newArrivals, bestsellers] = await Promise.all([
    getNewArrivals(8),
    getBestsellers(8),
  ]);

  return (
    <>
      <ProductRail
        title="الأكثر مبيعاً"
        titleEn="Bestsellers"
        subtitle="اختيارات العميلات الأكثر حباً"
        subtitleEn="The pieces clients reach for most"
        products={bestsellers}
        href="/shop"
        tone="ivory"
      />

      <ProductRail
        title="وصل حديثاً"
        titleEn="New arrivals"
        subtitle="قطع جديدة تُضاف للمجموعة"
        subtitleEn="Fresh edits just added to the house"
        products={newArrivals}
        href="/shop"
        tone="mist"
      />

      <GlobalOrigins />
    </>
  );
}

function HomeRailsFallback() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-5 py-10 sm:px-8" aria-busy>
      <div>
        <div className="h-6 w-40 animate-pulse rounded-full bg-[var(--plum)]/10" />
        <div className="mt-4 flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((__, j) => (
            <div
              key={j}
              className="aspect-[3/4] w-36 shrink-0 animate-pulse rounded-2xl bg-[var(--mist)] sm:w-44"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home-premium bg-[var(--ivory)]">
      <Suspense
        fallback={
          <div className="min-h-[52vh] animate-pulse bg-[var(--mist)]" aria-busy />
        }
      >
        <HomeAboveFold />
      </Suspense>
      <Suspense fallback={<HomeRailsFallback />}>
        <HomeProductRails />
      </Suspense>
      <ContactHelpCard />
    </div>
  );
}
