export type HomeHeroSlide = {
  id: string;
  /** Active in carousel */
  enabled: boolean;
  headlineAr: string;
  headlineEn: string;
  bodyAr: string;
  bodyEn: string;
  ctaAr: string;
  ctaEn: string;
  href: string;
  /** Desktop / default image — path or data URL */
  imageUrl: string;
  /** Optional mobile crop; falls back to imageUrl */
  imageUrlMobile?: string;
  /** object-position CSS */
  objectPosition?: string;
  /** Text block placement hint */
  textAlign?: "start" | "end" | "center";
  overlay?: "soft" | "medium" | "strong" | "none";
};

export type HomeHeroConfig = {
  version: number;
  autoplayMs: number;
  slides: HomeHeroSlide[];
};

export type HomeCategoryCard = {
  id: string;
  slug: string;
  enabled: boolean;
  titleAr: string;
  titleEn: string;
  ctaAr: string;
  ctaEn: string;
  href: string;
  imageUrl: string;
  objectPosition?: string;
};

export type HomeCategoryConfig = {
  version: number;
  cards: HomeCategoryCard[];
};
