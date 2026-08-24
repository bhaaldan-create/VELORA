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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    heroConfig,
    categoryConfig,
    promoConfig,
    newArrivals,
    bestsellers,
    skincare,
    makeup,
    hair,
    body,
  ] = await Promise.all([
    getHomeHeroConfig(),
    getHomeCategoryConfig(),
    getHomePromoConfig(),
    getNewArrivals(12),
    getBestsellers(12),
    getProductsByCategory("skincare"),
    getProductsByCategory("makeup"),
    getProductsByCategory("hair-care"),
    getProductsByCategory("body-care"),
  ]);

  return (
    <div className="home-premium bg-[var(--ivory)]">
      <Hero config={heroConfigForClient(heroConfig)} />
      <LarsaHomeBar />
      <CategoryShowcase cards={categoryConfigForClient(categoryConfig).cards} />
      <PromoBanner config={promoConfigForClient(promoConfig)} />

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

      <ContactHelpCard />
    </div>
  );
}
