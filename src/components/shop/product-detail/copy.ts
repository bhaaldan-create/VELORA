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
    about: ar ? "عن هذا المنتج" : "About This Product",
    readMore: ar ? "اقرأ المزيد" : "Read More",
    readLess: ar ? "عرض أقل" : "Show Less",
    ingredients: ar ? "المكونات الأساسية" : "Key Ingredients",
    suitability: ar ? "هل يناسب بشرتكِ؟" : "Is It Right For Your Skin?",
    suitableFor: ar ? "مناسب لـ" : "Suitable for",
    dailyUse: ar ? "الاستخدام اليومي" : "Daily use",
    concernsLabel: ar ? "الاحتياجات" : "Skin needs",
    larsaTitle: ar
      ? "لستِ متأكدة إن كان هذا المنتج مناسباً؟"
      : "Not sure if this product is right for you?",
    larsaSub: ar
      ? "اسألي لارسا — مستشارة الجمال في VELORA"
      : "Ask Larsa — VELORA Beauty & Skincare Advisor",
    askLarsa: ar ? "اسألي لارسا" : "Ask Larsa",
    addToBag: ar ? "أضيفي للحقيبة" : "Add to Bag",
    added: ar ? "أُضيفت ✓" : "Added ✓",
    outOfStock: ar ? "غير متوفر حالياً" : "Out of Stock",
    orderWhatsApp: ar ? "اطلبي عبر WhatsApp" : "Order via WhatsApp",
    qty: ar ? "الكمية" : "Quantity",
    decrease: ar ? "تقليل الكمية" : "Decrease quantity",
    increase: ar ? "زيادة الكمية" : "Increase quantity",
    reviews: ar ? "تقييم" : "Reviews",
    noReviews: ar ? "لا توجد تقييمات بعد" : "No reviews yet",
    viewReviews: ar ? "عرض التقييمات" : "View Reviews",
    bestSeller: ar ? "الأكثر مبيعاً" : "Best Seller",
    newBadge: ar ? "جديد" : "New",
    saleBadge: ar ? "تخفيض" : "Sale",
    save: ar ? "وفّري" : "Save",
    routine: ar ? "أكملي روتينكِ" : "Complete Your Routine",
    routineCurrent: ar ? "المنتج الحالي" : "Current product",
    routinePair: ar ? "أضيفي معه" : "Pair with",
    related: ar ? "قد يعجبكِ أيضاً" : "You May Also Like",
    size: ar ? "الحجم" : "Size",
  } as const;
}
