import type { SkinConcern } from "@/types";

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

export function productCopy(ar: boolean) {
  return {
    about: ar ? "عن المنتج" : "About the Product",
    readMore: ar ? "اقرئي المزيد" : "Read more",
    readLess: ar ? "عرض أقل" : "Show less",
    ingredients: ar ? "المكونات الأساسية" : "Key Ingredients",
    suitability: ar ? "هل يناسب بشرتكِ؟" : "Is it right for your skin?",
    suitableFor: ar ? "مناسب لـ" : "Suitable for",
    dailyUse: ar ? "استخدام يومي" : "Daily use",
    concernsLabel: ar ? "الاحتياجات" : "Skin needs",
    larsaEyebrow: ar ? "لارسا" : "Larsa",
    larsaTitle: ar ? "لستِ متأكدة؟" : "Not sure?",
    larsaSub: ar
      ? "اسألي لارسا — مستشارة VELORA للجمال والعناية بالبشرة"
      : "Ask Larsa — VELORA beauty & skincare advisor",
    askLarsa: ar ? "اسألي لارسا" : "Ask Larsa",
    addToBag: "أضف للحقيبة",
    added: "أُضيفت",
    outOfStock: ar ? "غير متوفر حالياً" : "Out of Stock",
    orderWhatsApp: ar ? "اطلبي عبر WhatsApp" : "Order via WhatsApp",
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
  } as const;
}
