import type { Category } from "@/types";

export const categories: Category[] = [
  {
    slug: "skincare",
    name: "Skincare",
    nameAr: "العناية بالبشرة",
    description:
      "Serums, cleansers, and moisturizers calibrated for radiance, balance, and lasting hydration.",
    descriptionAr:
      "سيرومات وغسولات ومرطبات مصممة للإشراقة والتوازن والترطيب العميق.",
    tagline: "Luminous skin, refined ritual",
    taglineAr: "بشرة مضيئة وطقس أنيق",
  },
  {
    slug: "body-care",
    name: "Body Care",
    nameAr: "العناية بالجسم",
    description:
      "Silken oils, nourishing creams, and sensorial textures for skin that feels cared for everywhere.",
    descriptionAr: "زيوت حريرية وكريمات مغذية بملامس فاخرة لجسم يُشعر بالعناية.",
    tagline: "Softness from shoulder to skin",
    taglineAr: "نعومة من الكتف حتى البشرة",
  },
  {
    slug: "hair-care",
    name: "Hair Care",
    nameAr: "العناية بالشعر",
    description:
      "Repair, shine, and scalp harmony — formulas that treat hair like a living crown.",
    descriptionAr: "إصلاح ولمعان وتوازن لفروة الرأس — تركيبات تعامل الشعر كتاج حي.",
    tagline: "Strength with quiet shine",
    taglineAr: "قوة بلمعان هادئ",
  },
  {
    slug: "makeup",
    name: "Makeup",
    nameAr: "المكياج",
    description:
      "Effortless color and skin-true finishes that enhance, never mask.",
    descriptionAr: "ألوان سلسة ولمسات قريبة من البشرة تُبرز ولا تُخفي.",
    tagline: "Color that feels like skin",
    taglineAr: "لون يُشعر كالبشرة",
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
