import type { ClubTierId } from "@/lib/club/types";

/** Passport display levels — map over Club tier IDs without changing Club logic. */
export type PassportLevelId = "muse" | "icon" | "elite" | "prive";

export type PassportLevelDef = {
  id: PassportLevelId;
  clubTierId: ClubTierId;
  nameEn: string;
  nameAr: string;
  mark: string;
};

export const PASSPORT_LEVELS: PassportLevelDef[] = [
  {
    id: "muse",
    clubTierId: "muse",
    nameEn: "MUSE",
    nameAr: "ميوز",
    mark: "✦",
  },
  {
    id: "icon",
    clubTierId: "glow",
    nameEn: "ICON",
    nameAr: "آيكون",
    mark: "✦",
  },
  {
    id: "elite",
    clubTierId: "signature",
    nameEn: "ELITE",
    nameAr: "إيليت",
    mark: "✦",
  },
  {
    id: "prive",
    clubTierId: "prive",
    nameEn: "PRIVÉ",
    nameAr: "بريفيه",
    mark: "✦",
  },
];

export function clubTierToPassportLevel(tierId: ClubTierId): PassportLevelDef {
  return (
    PASSPORT_LEVELS.find((l) => l.clubTierId === tierId) ?? PASSPORT_LEVELS[0]!
  );
}

export type PassportConfig = {
  version: number;
  numberPrefix: string;
  showQrCode: boolean;
  publicShareEnabled: boolean;
  birthdayFeatureEnabled: boolean;
};

export const DEFAULT_PASSPORT_CONFIG: PassportConfig = {
  version: 1,
  numberPrefix: "VL",
  showQrCode: true,
  publicShareEnabled: true,
  birthdayFeatureEnabled: true,
};

export type BeautyProfileData = {
  skinType: string;
  skinConcerns: string[];
  beautyGoals: string[];
  makeupStyle: string;
  preferredFinish: string;
  favoriteCategories: string[];
  preferredBrands: string[];
};

export const EMPTY_BEAUTY_PROFILE: BeautyProfileData = {
  skinType: "",
  skinConcerns: [],
  beautyGoals: [],
  makeupStyle: "",
  preferredFinish: "",
  favoriteCategories: [],
  preferredBrands: [],
};

export const SKIN_TYPE_OPTIONS = [
  { id: "dry", en: "Dry", ar: "جافة" },
  { id: "oily", en: "Oily", ar: "دهنية" },
  { id: "combination", en: "Combination", ar: "مختلطة" },
  { id: "normal", en: "Normal", ar: "عادية" },
  { id: "sensitive", en: "Sensitive", ar: "حساسة" },
] as const;

export const SKIN_CONCERN_OPTIONS = [
  { id: "hydration", en: "Hydration", ar: "ترطيب" },
  { id: "glow", en: "Glow", ar: "إشراق" },
  { id: "texture", en: "Even Texture", ar: "ملمس متجانس" },
  { id: "acne", en: "Acne", ar: "حب الشباب" },
  { id: "pores", en: "Pores", ar: "المسام" },
  { id: "pigmentation", en: "Pigmentation", ar: "تصبغات" },
  { id: "aging", en: "Aging", ar: "مضاد شيخوخة" },
] as const;

export const BEAUTY_GOAL_OPTIONS = [
  { id: "hydration", en: "Hydration", ar: "ترطيب" },
  { id: "glow", en: "Glow", ar: "إشراق" },
  { id: "even-texture", en: "Even Texture", ar: "ملمس متجانس" },
  { id: "coverage", en: "Coverage", ar: "تغطية" },
  { id: "natural-look", en: "Natural Look", ar: "إطلالة طبيعية" },
] as const;

export const MAKEUP_STYLE_OPTIONS = [
  { id: "natural-glow", en: "Natural Glow", ar: "إشراق طبيعي" },
  { id: "soft-glam", en: "Soft Glam", ar: "سوفت جلام" },
  { id: "bold", en: "Bold", ar: "جريئة" },
  { id: "minimal", en: "Minimal", ar: "مينيمال" },
] as const;

export const FINISH_OPTIONS = [
  { id: "dewy", en: "Dewy", ar: "نديّ" },
  { id: "satin", en: "Satin", ar: "ساتان" },
  { id: "matte", en: "Matte", ar: "مطفي" },
  { id: "natural", en: "Natural", ar: "طبيعي" },
] as const;

export const CATEGORY_OPTIONS = [
  { id: "skincare", en: "Skincare", ar: "العناية" },
  { id: "makeup", en: "Makeup", ar: "مكياج" },
  { id: "k-beauty", en: "K-Beauty", ar: "K-Beauty" },
  { id: "body", en: "Body", ar: "الجسم" },
  { id: "fragrance", en: "Fragrance", ar: "عطور" },
] as const;
