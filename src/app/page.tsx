import { CategoryStrip } from "@/components/home/CategoryStrip";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { GlobalOrigins } from "@/components/home/GlobalOrigins";
import { Hero } from "@/components/home/Hero";
import { PaymentTrust } from "@/components/home/PaymentTrust";
import { RitualBanner } from "@/components/home/RitualBanner";
import { WorldBrands } from "@/components/home/WorldBrands";

export default function HomePage() {
  return (
    <>
      <Hero />
      <GlobalOrigins />
      <WorldBrands />
      <CategoryStrip />
      <FeaturedProducts />
      <PaymentTrust />
      <RitualBanner />
    </>
  );
}
