import type { CategorySlug, SkinConcern } from "@/types";

export type PopularSearch = {
  id: string;
  labelEn: string;
  labelAr: string;
  href: string;
};

/** Curated from real catalog taxonomy — not fake analytics. */
export const popularSearches: PopularSearch[] = [
  {
    id: "serum",
    labelEn: "Serum",
    labelAr: "سيروم",
    href: "/search?q=serum&sort=best-match",
  },
  {
    id: "sunscreen",
    labelEn: "Sunscreen",
    labelAr: "واقي شمس",
    href: "/search?q=sunscreen&sort=best-match",
  },
  {
    id: "moisturizer",
    labelEn: "Moisturizer",
    labelAr: "مرطب",
    href: "/search?q=moisturizer&sort=best-match",
  },
  {
    id: "acne",
    labelEn: "Acne care",
    labelAr: "العناية بحب الشباب",
    href: "/search?concern=acne&sort=best-selling",
  },
  {
    id: "hydration",
    labelEn: "Hydration",
    labelAr: "ترطيب",
    href: "/search?concern=hydration&sort=best-selling",
  },
  {
    id: "skincare",
    labelEn: "Skincare",
    labelAr: "العناية بالبشرة",
    href: "/shop?category=skincare",
  },
  {
    id: "makeup",
    labelEn: "Makeup",
    labelAr: "المكياج",
    href: "/shop?category=makeup",
  },
  {
    id: "sale",
    labelEn: "On sale",
    labelAr: "عروض",
    href: "/search?onSale=1&sort=on-sale",
  },
];

export const SKIN_TYPE_LABELS: Record<
  string,
  { en: string; ar: string }
> = {
  oily: { en: "Oily", ar: "دهنية" },
  dry: { en: "Dry", ar: "جافة" },
  combination: { en: "Combination", ar: "مختلطة" },
  normal: { en: "Normal", ar: "عادية" },
  sensitive: { en: "Sensitive", ar: "حساسة" },
};

export const CONCERN_LABELS: Record<
  SkinConcern,
  { en: string; ar: string }
> = {
  hydration: { en: "Hydration", ar: "ترطيب" },
  glow: { en: "Glow", ar: "إشراقة" },
  acne: { en: "Acne", ar: "حب الشباب" },
  "anti-aging": { en: "Anti-Aging", ar: "مقاومة الشيخوخة" },
  sensitivity: { en: "Sensitivity", ar: "حساسية" },
  "oil-control": { en: "Oil Control", ar: "التحكم بالدهون" },
};

export const CATEGORY_LABELS: Record<
  CategorySlug,
  { en: string; ar: string }
> = {
  skincare: { en: "Skincare", ar: "العناية بالبشرة" },
  "body-care": { en: "Body Care", ar: "العناية بالجسم" },
  "hair-care": { en: "Hair Care", ar: "العناية بالشعر" },
  makeup: { en: "Makeup", ar: "المكياج" },
};

export const SORT_LABELS: Record<
  string,
  { en: string; ar: string }
> = {
  "best-match": { en: "Best Match", ar: "الأفضل تطابقًا" },
  "best-selling": { en: "Best Selling", ar: "الأكثر طلبًا" },
  "top-rated": { en: "Top Rated", ar: "الأعلى تقييمًا" },
  newest: { en: "Newest", ar: "الأحدث" },
  "price-asc": { en: "Price: Low → High", ar: "السعر: من الأقل للأعلى" },
  "price-desc": { en: "Price: High → Low", ar: "السعر: من الأعلى للأقل" },
  "most-reviewed": { en: "Most Reviewed", ar: "الأكثر تقييمًا" },
  "on-sale": { en: "On Sale", ar: "العروض" },
};
