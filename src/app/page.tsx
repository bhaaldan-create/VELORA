import { Suspense } from "react";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { Hero } from "@/components/home/Hero";
import { LarsaHomeBar } from "@/components/home/LarsaHomeBar";
import { ProductRail } from "@/components/home/ProductRail";
import { PromoBanner } from "@/components/home/PromoBanner";
import { ContactHelpCard } from "@/components/contact/ContactHelpCard";
import { GlobalOrigins } from "@/components/home/GlobalOrigins";
import {
  getBestsellers,
  getNewArrivals,
  getProductsByBrandSlug,
} from "@/lib/catalog";
import {
  getHomeCategoryConfigForStorefront,
  getHomeHeroConfigForStorefront,
} from "@/lib/home/config";
import { getHomePromoConfigForStorefront } from "@/lib/home/promo-config";

/** Dynamic: product image payloads exceed Vercel ISR size limits when prerendered. */
export const dynamic = "force-dynamic";

const HOME_BRAND_RAILS = [
  {
    slug: "anua",
    title: "أنوا",
    titleEn: "Anua",
    logoSrc: "/brands/logos/home-rails/anua.png",
    logoHeight: 34,
    logoMaxWidth: 132,
    tone: "white" as const,
  },
  {
    slug: "loreal",
    title: "لوريال",
    titleEn: "L'Oréal Paris",
    logoSrc: "/brands/logos/home-rails/loreal-paris.png",
    logoHeight: 42,
    logoMaxWidth: 148,
    tone: "ivory" as const,
  },
  {
    slug: "maybelline",
    title: "ميبيلين",
    titleEn: "Maybelline",
    logoSrc: "/brands/logos/home-rails/maybelline.png",
    logoHeight: 32,
    logoMaxWidth: 168,
    tone: "mist" as const,
  },
] as const;

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
  const [newArrivals, bestsellers, anua, loreal, maybelline] =
    await Promise.all([
      getNewArrivals(8),
      getBestsellers(8),
      getProductsByBrandSlug("anua", 8),
      getProductsByBrandSlug("loreal", 8),
      getProductsByBrandSlug("maybelline", 8),
    ]);

  const brandProducts: Record<string, typeof anua> = {
    anua,
    loreal,
    maybelline,
  };

  return (
    <>
      <ProductRail
        title="الأكثر مبيعاً"
        titleEn="Bestsellers"
        products={bestsellers}
        href="/shop"
        tone="ivory"
      />

      <ProductRail
        title="وصل حديثاً"
        titleEn="New arrivals"
        products={newArrivals}
        href="/shop"
        tone="mist"
      />

      {HOME_BRAND_RAILS.map((rail) => (
        <ProductRail
          key={rail.slug}
          title={rail.title}
          titleEn={rail.titleEn}
          logoSrc={rail.logoSrc}
          logoHeight={rail.logoHeight}
          logoMaxWidth={rail.logoMaxWidth}
          products={brandProducts[rail.slug] ?? []}
          href={`/shop?brand=${rail.slug}`}
          tone={rail.tone}
        />
      ))}

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
    <div className="home-premium bg-[var(--background)]">
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
