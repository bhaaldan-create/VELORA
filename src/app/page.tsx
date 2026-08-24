import { Suspense } from "react";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { GlobalOrigins } from "@/components/home/GlobalOrigins";
import { Hero } from "@/components/home/Hero";
import { LarsaHomeBar } from "@/components/home/LarsaHomeBar";
import { ProductRail } from "@/components/home/ProductRail";
import { PromoBanner } from "@/components/home/PromoBanner";
import { ContactHelpCard } from "@/components/contact/ContactHelpCard";
import {
  getBestsellers,
  getNewArrivals,
  getProductsByCategory,
} from "@/lib/catalog";
import {
  categoryConfigForClient,
  getHomeCategoryConfig,
  getHomeHeroConfig,
  heroConfigForClient,
} from "@/lib/home/config";
import {
  getHomePromoConfig,
  promoConfigForClient,
} from "@/lib/home/promo-config";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

async function HomeAboveFold() {
  const [heroConfig, categoryConfig, promoConfig] = await Promise.all([
    getHomeHeroConfig(),
    getHomeCategoryConfig(),
    getHomePromoConfig(),
  ]);

  return (
    <>
      <Hero config={heroConfigForClient(heroConfig)} />
      <LarsaHomeBar />
      <CategoryShowcase cards={categoryConfigForClient(categoryConfig).cards} />
      <PromoBanner config={promoConfigForClient(promoConfig)} />
    </>
  );
}

async function HomeProductRails() {
  const [newArrivals, bestsellers, skincare, makeup, hair, body] =
    await Promise.all([
      getNewArrivals(12),
      getBestsellers(12),
      getProductsByCategory("skincare", 12),
      getProductsByCategory("makeup", 12),
      getProductsByCategory("hair-care", 12),
      getProductsByCategory("body-care", 12),
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

      <ProductRail
        title="العناية بالبشرة"
        titleEn="Skincare"
        subtitle="إشراقة تبدأ من الروتين اليومي"
        subtitleEn="Radiance begins with the daily ritual"
        products={skincare}
        href="/shop?category=skincare"
        tone="white"
      />

      <ProductRail
        title="المكياج"
        titleEn="Makeup"
        subtitle="لون يُبرز ولا يُخفي"
        subtitleEn="Color that enhances, never masks"
        products={makeup}
        href="/shop?category=makeup"
        tone="mist"
      />

      <ProductRail
        title="العناية بالشعر"
        titleEn="Hair care"
        subtitle="لمعان هادئ وقوة تدوم"
        subtitleEn="Quiet shine with lasting strength"
        products={hair}
        href="/shop?category=hair-care"
        tone="ivory"
      />

      <ProductRail
        title="العناية بالجسم"
        titleEn="Body care"
        subtitle="نعومة تبدأ من أول لمسة"
        subtitleEn="Softness from the very first touch"
        products={body}
        href="/shop?category=body-care"
        tone="white"
      />
    </>
  );
}

function HomeRailsFallback() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-5 py-10 sm:px-8" aria-busy>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i}>
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
      ))}
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
