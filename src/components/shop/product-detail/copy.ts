import type { SkinConcern, SkinType } from "@/types";

export const CONCERN_LABELS: Record<
  SkinConcern,
  { ar: string; en: string }
> = {
  hydration: { ar: "ترطيب", en: "Hydration" },
  glow: { ar: "إشراقة", en: "Glow" },
  acne: { ar: "تنقية", en: "Clarity" },
  "anti-aging": { ar: "تماسك", en: "Firmness" },
  sensitivity: { ar: "تهدئة", en: "Sensitivity" },
  "oil-control": { ar: "توازن", en: "Oil balance" },
};

export const SKIN_TYPE_COPY: Record<
  SkinType,
  { ar: string; en: string; hintAr: string; hintEn: string }
> = {
  dry: {
    ar: "جافة",
    en: "Dry",
    hintAr: "مناسب للبشرة التي تحتاج ترطيبًا عميقًا",
    hintEn: "Ideal when skin needs deeper hydration",
  },
  oily: {
    ar: "دهنية",
    en: "Oily",
    hintAr: "مناسب للتحكم بالزيوت واللمعان",
    hintEn: "Helps balance oil and shine",
  },
  combination: {
    ar: "مختلطة",
    en: "Combination",
    hintAr: "مناسب للمناطق التي تحتاج توازنًا",
    hintEn: "Balances areas that need harmony",
  },
  normal: {
    ar: "عادية",
    en: "Normal",
    hintAr: "مناسب للعناية اليومية المتوازنة",
    hintEn: "Suited to balanced daily care",
  },
  sensitive: {
    ar: "حساسة",
    en: "Sensitive",
    hintAr: "مناسب للبشرة الحساسة واللطيفة",
    hintEn: "Gentle enough for sensitive skin",
  },
};

/** Drop empty / placeholder catalog values like "None". */
export function isPresentValue(value: string | null | undefined): boolean {
  const t = (value ?? "").trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  return ![
    "none",
    "null",
    "undefined",
    "n/a",
    "na",
    "-",
    "—",
    "–",
    "غير متوفر",
    "غير متوفرة",
  ].includes(lower);
}

export function productCopy(ar: boolean) {
  return {
    about: ar ? "عن المنتج" : "About the Product",
    aboutEn: "About the Product",
    aboutAr: "عن المنتج",
    readMore: ar ? "عرض المزيد" : "Read more",
    readLess: ar ? "عرض أقل" : "Show less",
    ingredients: ar ? "المكونات الأساسية" : "Key Ingredients",
    ingredientsUnavailable: ar
      ? "المكونات غير متوفرة حاليًا"
      : "Ingredients are not available yet",
    suitability: ar ? "هل يناسب بشرتك؟" : "Is it right for your skin?",
    suitabilitySub: ar
      ? "تعرفي على مدى ملاءمة هذا المنتج لبشرتك"
      : "See how this product aligns with your skin",
    suitableFor: ar ? "مناسب لـ" : "Suitable for",
    concernsLabel: ar ? "الاحتياجات" : "Skin needs",
    details: ar ? "تفاصيل المنتج" : "Product details",
    detailSize: ar ? "الحجم" : "Size",
    detailType: ar ? "النوع" : "Type",
    detailCategory: ar ? "الفئة" : "Category",
    detailBrand: ar ? "العلامة التجارية" : "Brand",
    detailCoverage: ar ? "التغطية" : "Coverage",
    detailFinish: ar ? "اللمسة النهائية" : "Finish",
    detailSpf: ar ? "الحماية SPF" : "SPF",
    detailSku: ar ? "رمز المنتج" : "SKU",
    keyBenefits: ar ? "أبرز المزايا" : "Key benefits",
    larsaEyebrow: ar ? "لارسا" : "Larsa",
    larsaTitle: ar
      ? "محتارة إذا هذا المنتج يناسبك؟"
      : "Not sure if this is right for you?",
    larsaSub: ar
      ? "اسألي لارسا — مستشارة VELORA للجمال والعناية بالبشرة"
      : "Ask Larsa — VELORA beauty & skincare advisor",
    askLarsa: ar ? "اسألي لارسا" : "Ask Larsa",
    addToBag: "أضف للحقيبة",
    added: "أُضيفت",
    outOfStock: ar ? "نفذ" : "Sold out",
    orderWhatsApp: ar ? "اطلب عبر واتساب" : "Order via WhatsApp",
    orderWhatsAppHint: ar
      ? "تواصل معنا مباشرة لإتمام طلبك"
      : "Message us directly to complete your order",
    qty: ar ? "الكمية" : "Quantity",
    decrease: ar ? "تقليل الكمية" : "Decrease quantity",
    increase: ar ? "زيادة الكمية" : "Increase quantity",
    reviews: ar ? "تقييم" : "reviews",
    noReviews: ar ? "لا توجد تقييمات بعد" : "No reviews yet",
    viewReviews: ar ? "شاهد التقييمات" : "View reviews",
    bestSeller: ar ? "الأكثر مبيعاً" : "Best Seller",
    newBadge: ar ? "جديد" : "New",
    saleBadge: ar ? "تخفيض" : "Sale",
    save: ar ? "وفّري" : "Save",
    routine: ar ? "أكملي روتينكِ" : "Complete Your Routine",
    routineCurrent: ar ? "حالي" : "Now",
    routinePair: ar ? "التالي" : "Next",
    related: ar ? "قد يعجبكِ أيضاً" : "You May Also Like",
    size: ar ? "الحجم" : "Size",
    moreBenefits: ar ? "المزيد" : "More",
    lessBenefits: ar ? "أقل" : "Less",
    zoomHint: ar ? "مرري للتكبير" : "Hover to zoom",
    imageOf: ar ? "من" : "of",
    favorite: ar ? "المفضلة" : "Wishlist",
  } as const;
}
