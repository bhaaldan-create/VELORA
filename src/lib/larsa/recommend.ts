import type { Product, SkinConcern, SkinType } from "@/types";
import { getAdvisorProducts } from "@/lib/catalog";
import type { LarsaPathId } from "@/data/larsa-consultation";

export type LarsaRecommendInput = {
  pathId: LarsaPathId | string;
  categoryHint: string;
  budget: string;
  tags: string[];
  freeText?: string;
};

export type LarsaProductInsight = {
  productId: string;
  whyAr: string;
};

const PRODUCT_TYPE_ORDER: Record<string, number> = {
  cleanser: 1,
  "face-wash": 1,
  غسول: 1,
  toner: 2,
  تونر: 2,
  essence: 3,
  serum: 4,
  سيروم: 4,
  treatment: 5,
  mask: 6,
  ماسك: 6,
  moisturizer: 7,
  cream: 7,
  كريم: 7,
  oil: 8,
  زيت: 8,
  sunscreen: 9,
  spf: 9,
  "sun-screen": 9,
  primer: 2,
  foundation: 3,
  concealer: 4,
  lipstick: 5,
  mascara: 5,
  shampoo: 1,
  conditioner: 2,
  "hair-mask": 3,
  "hair-oil": 4,
  "body-wash": 1,
  "body-lotion": 2,
  "body-oil": 3,
};

function concernsFromTags(tags: string[]): SkinConcern[] {
  const hay = tags.join(" ").toLowerCase();
  const out: SkinConcern[] = [];
  if (/جفاف|ترطيب|نشفة|hydration|dry/.test(hay)) out.push("hydration");
  if (/نضارة|بهتان|إشراقة|glow|bright/.test(hay)) out.push("glow");
  if (/حبوب|تنقية|acne|blemish/.test(hay)) out.push("acne");
  if (/خطوط|تماسك|anti|aging|wrinkle/.test(hay)) out.push("anti-aging");
  if (/حساس|احمرار|sensitivity|sensitive/.test(hay)) out.push("sensitivity");
  if (/لمعان|دهن|مسام|oil|oily/.test(hay)) out.push("oil-control");
  return out;
}

function skinTypesFromTags(tags: string[]): SkinType[] {
  const hay = tags.join(" ").toLowerCase();
  const out: SkinType[] = [];
  if (/جاف|جافة|dry/.test(hay)) out.push("dry");
  if (/دهن|دهنية|oily|لمعان/.test(hay)) out.push("oily");
  if (/مختلط|combination/.test(hay)) out.push("combination");
  if (/حساس|sensitive/.test(hay)) out.push("sensitive");
  if (/طبيع|normal/.test(hay)) out.push("normal");
  return out;
}

function categoryFromHint(
  hint: string,
  tags: string[],
): Product["category"] | "all" {
  if (hint && hint !== "all") return hint as Product["category"];
  const hay = tags.join(" ");
  if (/شعر|فروة|تساقط/.test(hay)) return "hair-care";
  if (/مكياج|عيون|شفاه|فاونديشن|كونسيلر|برايمر/.test(hay)) return "makeup";
  if (/جسم|عطر|رائحة|استحمام/.test(hay)) return "body-care";
  if (/بشرة|وجه|جفاف|حبوب|نضارة|سيروم|غسول/.test(hay)) return "skincare";
  return "all";
}

function budgetRank(price: number, budget: string) {
  if (budget === "economy") {
    if (price <= 25000) return 3;
    if (price <= 45000) return 2;
    if (price <= 70000) return 1;
    return 0;
  }
  if (budget === "mid") {
    if (price >= 20000 && price <= 90000) return 3;
    if (price < 20000 || price <= 120000) return 1;
    return 0;
  }
  if (budget === "luxury" || budget === "luxe") {
    if (price >= 80000) return 3;
    if (price >= 50000) return 2;
    if (price >= 30000) return 1;
    return 0;
  }
  return 1;
}

function productHaystack(p: Product): string {
  return [
    p.name,
    p.nameAr,
    p.descriptionAr,
    p.benefitsAr.join(" "),
    p.benefits.join(" "),
    p.ingredients.join(" "),
    (p.featureTags ?? []).join(" "),
    p.productType ?? "",
    p.brandName ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function tagMatchScore(hay: string, tags: string[], freeText?: string): number {
  let score = 0;
  for (const t of tags) {
    const q = t.trim().toLowerCase();
    if (q.length > 2 && hay.includes(q)) score += 0.9;
  }
  if (freeText) {
    const ft = freeText.toLowerCase();
    for (const w of ft.split(/\s+/)) {
      if (w.length > 2 && hay.includes(w)) score += 0.5;
    }
  }
  return score;
}

function productTypeRank(productType: string | null | undefined): number {
  if (!productType) return 50;
  const key = productType.toLowerCase();
  if (PRODUCT_TYPE_ORDER[key] != null) return PRODUCT_TYPE_ORDER[key];
  for (const [k, v] of Object.entries(PRODUCT_TYPE_ORDER)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return 50;
}

function orderProductsForRitual(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => productTypeRank(a.productType) - productTypeRank(b.productType),
  );
}

export async function recommendFromLarsaProfile(
  input: LarsaRecommendInput,
): Promise<{
  products: Product[];
  ritualSteps: string[];
  ritualNote: string;
  understood: string[];
}> {
  const products = await getAdvisorProducts();
  const concerns = concernsFromTags(input.tags);
  const skinTypes = skinTypesFromTags(input.tags);
  const category = categoryFromHint(input.categoryHint, input.tags);
  const understood = input.tags.filter(Boolean).slice(0, 6);

  const scored = products
    .map((p) => {
      let score = 0;
      const hay = productHaystack(p);

      if (category !== "all" && p.category === category) score += 4;
      if (concerns.some((c) => p.concerns.includes(c))) score += 3;
      if (skinTypes.length && skinTypes.some((s) => p.skinTypes?.includes(s))) {
        score += 2.5;
      }
      if (input.tags.some((t) => p.featureTags?.some((f) => f.includes(t)))) {
        score += 1.5;
      }
      if (p.isBestseller) score += 1.2;
      if (p.isNew) score += 0.4;
      if (typeof p.stock === "number" && p.stock > 0) score += 0.3;
      score += budgetRank(p.price, input.budget);
      score += tagMatchScore(hay, input.tags, input.freeText);

      if (input.pathId === "unsure" && p.isBestseller) score += 0.6;
      if (input.pathId === "full-ritual" && p.isBestseller) score += 0.4;

      return { p, score };
    })
    .sort((a, b) => b.score - a.score);

  const withScore = scored.filter((s) => s.score > 0);
  const rawPicked =
    withScore.length > 0
      ? withScore.slice(0, 4).map((s) => s.p)
      : products.filter((p) => p.isBestseller).slice(0, 3);

  const picked = orderProductsForRitual(rawPicked);
  const ritualSteps = buildRitualSteps(category, picked, input.tags);
  const ritualNote =
    "رتّبت لكِ الخطوات من الأخف للأثقل — ابدئي بلطف وراقبي بشرتكِ أو شعركِ أسبوعاً قبل إضافة خطوة جديدة.";

  return { products: picked, ritualSteps, ritualNote, understood };
}

function buildRitualSteps(
  category: string,
  products: Product[],
  tags: string[],
): string[] {
  if (category === "hair-care") {
    const damaged = /تالف|جاف|dry|damage/.test(tags.join(" "));
    return damaged
      ? [
          "نظّفي الفروة بشامبو لطيف — مرتين أسبوعياً كحد أقصى إن كانت جافة",
          "طبّقي ماسك أو علاج على الأطراف — اتركيه 5–10 دقائق",
          "اشطفي ببرودة خفيفة ثم بلّلي بمنشفة — لا تفركي",
          "أنهّي بزيت أو سيروم خفيف على الأطراف فقط",
        ]
      : [
          "نظّفي الفروة بلطف",
          "طبّقي العلاج أو الماسك حسب الحاجة",
          "أنهّي بترطيب خفيف يحمي من الجفاف",
        ];
  }
  if (category === "makeup") {
    return [
      "بشرة نظيفة ومرطّبة بخفة — انتظري دقيقة قبل المكياج",
      "الأساس أو اللون الأساسي بكمية صغيرة",
      "لمسات العيون أو الشفاه حسب المناسبة",
      "تثبيت خفيف — خاصة في حر العراق",
    ];
  }
  if (category === "body-care") {
    return [
      "بعد الاستحمام على بشرة رطبة — الوقت الذهبي للترطيب",
      "طبقة ترطيب أو زيت من الرقبة للقدمين",
      "ركّزي على المرفقين والركبتين إن كانت جافة",
    ];
  }

  const named = products.map((p) => p.nameAr).filter(Boolean);
  if (products.length >= 3 && named.length >= 2) {
    return [
      `ابدئي بـ${named[0] ?? "التنظيف"} — بلطف دون فرك`,
      named[1] ? `طبّقي ${named[1]} على بشرة نظيفة` : "علاج مركّز (سيروم)",
      named[2]
        ? `اختمي بـ${named[2]}`
        : "ترطيب يختم الروتين",
      "نهاراً: لا تنسي الحماية من الشمس في العراق",
    ];
  }
  if (products.length >= 3) {
    return [
      "تنظيف لطيف",
      "علاج مركّز (سيروم)",
      "ترطيب يختم الروتين",
      "حماية نهارية عند الخروج",
    ];
  }
  return [
    "تنظيف",
    "علاج أو ترطيب حسب المنتج",
    "الاستمرارية أهم من كثرة الخطوات",
  ];
}
