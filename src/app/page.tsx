import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { GlobalOrigins } from "@/components/home/GlobalOrigins";
import { Hero } from "@/components/home/Hero";
import { LarsaPremium } from "@/components/home/LarsaPremium";
import { ProductRail } from "@/components/home/ProductRail";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TrustBar } from "@/components/home/TrustBar";
import { ContactHelpCard } from "@/components/contact/ContactHelpCard";
import {
  getBestsellers,
  getFragranceProducts,
  getNewArrivals,
  getProductsByCategory,
} from "@/lib/catalog";
import { getHomeHeroConfig } from "@/lib/home/config";

export default async function HomePage() {
  const [heroConfig, newArrivals, bestsellers, skincare, makeup, hair, body, fragrance] =
    await Promise.all([
      getHomeHeroConfig(),
      getNewArrivals(12),
      getBestsellers(12),
      getProductsByCategory("skincare"),
      getProductsByCategory("makeup"),
      getProductsByCategory("hair-care"),
      getProductsByCategory("body-care"),
      getFragranceProducts(12),
    ]);

  return (
    <div className="home-premium bg-[var(--ivory)]">
      <Hero config={heroConfig} />
      <TrustBar />
      <CategoryShowcase />
      <PromoBanner />

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

      {fragrance.length > 0 ? (
        <ProductRail
          title="العطور"
          titleEn="Fragrance"
          subtitle="رائحة تترك أثراً"
          subtitleEn="A scent that leaves a trace"
          products={fragrance}
          href="/shop"
          tone="mist"
        />
      ) : null}

      <LarsaPremium />
      <ContactHelpCard />
    </div>
  );
}
