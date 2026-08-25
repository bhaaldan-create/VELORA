export type VeloraCardStyleKey =
  | "signature"
  | "soft-beauty"
  | "dark-luxury"
  | "editorial"
  | "brand-focus";

export type VeloraCardType =
  | "order"
  | "journey"
  | "achievement"
  | "unboxing"
  | "personality";

export type VeloraThemeKey =
  | "beauty-moment"
  | "beauty-haul"
  | "skincare-haul"
  | "makeup-haul"
  | "haircare-haul"
  | "k-beauty-haul"
  | "brand-moment";

export type VeloraCardProduct = {
  id: string;
  name: string;
  nameAr: string;
  quantity: number;
  imageUrl: string | null;
  brandName: string;
  brandLogoUrl: string | null;
  categorySlug: string;
};

export type VeloraCardBrand = {
  name: string;
  logoUrl: string | null;
};

export type VeloraCardPayload = {
  orderId: string;
  orderDate: string;
  subtitleEn: string;
  subtitleAr: string;
  products: VeloraCardProduct[];
  brands: VeloraCardBrand[];
  productCount: number;
  brandCount: number;
  pointsEarned: number;
  pointsLabelEn: string;
  pointsLabelAr: string;
  footerEn: string;
  footerAr: string;
  referralUrl: string;
  showQrCode: boolean;
};

export type VeloraCardConfig = {
  version: number;
  referralRewardPoints: number;
  referralMinOrderIqd: number;
  referralMaxMonthlyRewards: number;
  referralExpirationDays: number;
  reviewRewardPoints: number;
  showQrCode: boolean;
  shareEarnEnabled: boolean;
  campaignStart?: string;
  campaignEnd?: string;
};

export type VeloraJourneyStats = {
  totalOrders: number;
  totalProducts: number;
  brandsTried: number;
  totalPoints: number;
  hasEligibleOrders: boolean;
};

export type VeloraCardStyleOption = {
  key: VeloraCardStyleKey;
  nameEn: string;
  nameAr: string;
  backgroundUrl: string;
  overlayClass?: string;
};

export const CARD_STYLE_OPTIONS: VeloraCardStyleOption[] = [
  {
    key: "signature",
    nameEn: "VELORA Signature",
    nameAr: "VELORA Signature",
    backgroundUrl: "/my-velora/templates/velora-signature-master.png",
  },
  {
    key: "soft-beauty",
    nameEn: "Soft Beauty",
    nameAr: "Soft Beauty",
    backgroundUrl: "/my-velora/templates/velora-signature-master.png",
    overlayClass: "mv-style-soft-beauty",
  },
  {
    key: "dark-luxury",
    nameEn: "Dark Luxury",
    nameAr: "Dark Luxury",
    backgroundUrl: "/my-velora/templates/velora-signature-master.png",
    overlayClass: "mv-style-dark-luxury",
  },
  {
    key: "editorial",
    nameEn: "Editorial",
    nameAr: "Editorial",
    backgroundUrl: "/my-velora/templates/velora-signature-master.png",
    overlayClass: "mv-style-editorial",
  },
  {
    key: "brand-focus",
    nameEn: "Brand Focus",
    nameAr: "Brand Focus",
    backgroundUrl: "/my-velora/templates/velora-signature-master.png",
    overlayClass: "mv-style-brand-focus",
  },
];

export const ACHIEVEMENT_DEFS = [
  {
    key: "first-order",
    nameEn: "VELORA Beginner",
    nameAr: "بداية VELORA",
    descEn: "Your first VELORA beauty moment.",
    descAr: "أول لحظة جمال مع VELORA.",
    threshold: { orders: 1 },
  },
  {
    key: "three-orders",
    nameEn: "Beauty Explorer",
    nameAr: "مستكشفة الجمال",
    descEn: "Three VELORA orders completed.",
    descAr: "ثلاثة طلبات VELORA مكتملة.",
    threshold: { orders: 3 },
  },
  {
    key: "five-orders",
    nameEn: "Beauty Insider",
    nameAr: "Beauty Insider",
    descEn: "Five VELORA orders completed.",
    descAr: "خمسة طلبات VELORA مكتملة.",
    threshold: { orders: 5 },
  },
  {
    key: "ten-orders",
    nameEn: "VELORA Icon",
    nameAr: "VELORA Icon",
    descEn: "Ten VELORA orders completed.",
    descAr: "عشرة طلبات VELORA مكتملة.",
    threshold: { orders: 10 },
  },
  {
    key: "five-brands",
    nameEn: "Brand Explorer",
    nameAr: "مستكشفة العلامات",
    descEn: "Five brands discovered through VELORA.",
    descAr: "خمس علامات تجارية عبر VELORA.",
    threshold: { brands: 5 },
  },
  {
    key: "ten-brands",
    nameEn: "Brand Collector",
    nameAr: "جامعة العلامات",
    descEn: "Ten brands discovered through VELORA.",
    descAr: "عشر علامات تجارية عبر VELORA.",
    threshold: { brands: 10 },
  },
] as const;
