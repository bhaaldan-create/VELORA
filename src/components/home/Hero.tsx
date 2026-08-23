"use client";

import { HeroCarousel } from "@/components/home/HeroCarousel";
import type { HomeHeroConfig } from "@/lib/home/types";

/** Server-passed hero config → client carousel */
export function Hero({ config }: { config: HomeHeroConfig }) {
  return <HeroCarousel config={config} />;
}
