import type { Product, SkinConcern } from "@/types";
import { getAllProducts } from "@/lib/catalog";
import type { LarsaPathId } from "@/data/larsa-consultation";

export type LarsaRecommendInput = {
  pathId: LarsaPathId | string;
  categoryHint: string;
  budget: string;
  tags: string[];
  freeText?: string;
};

function concernsFromTags(tags: string[]): SkinConcern[] {
  const hay = tags.join(" ").toLowerCase();
  const out: SkinConcern[] = [];
  if (/جفاف|ترطيب|نشفة|hydration/.test(hay)) out.push("hydration");
  if (/نضارة|بهتان|إشراقة|glow/.test(hay)) out.push("glow");
  if (/حبوب|تنقية|acne/.test(hay)) out.push("acne");
  if (/خطوط|تماسك|anti/.test(hay)) out.push("anti-aging");
  if (/حساس|احمرار|sensitivity/.test(hay)) out.push("sensitivity");
  if (/لمعان|دهن|مسام|oil/.test(hay)) out.push("oil-control");
  return out;
}

function categoryFromHint(
  hint: string,
  tags: string[],
): Product["category"] | "all" {
  if (hint && hint !== "all") return hint as Product["category"];
  const hay = tags.join(" ");
  if (/شعر/.test(hay)) return "hair-care";
  if (/مكياج|عيون|شفاه|فاونديشن/.test(hay)) return "makeup";
  if (/جسم|عطر|رائحة/.test(hay)) return "body-care";
  if (/بشرة|وجه|جفاف|حبوب|نضارة/.test(hay)) return "skincare";
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
  if (budget === "luxe") {
    if (price >= 50000) return 3;
    if (price >= 30000) return 1;
    return 0;
  }
  return 1;
}

export async function recommendFromLarsaProfile(
  input: LarsaRecommendInput,
): Promise<{
  products: Product[];
  ritualSteps: string[];
  ritualNote: string;
  understood: string[];
}> {
  const products = await getAllProducts();
  const concerns = concernsFromTags(input.tags);
  const category = categoryFromHint(input.categoryHint, input.tags);
  const understood = input.tags.filter(Boolean).slice(0, 6);

  const scored = products
    .map((p) => {
      let score = 0;
      if (category !== "all" && p.category === category) score += 4;
      if (concerns.some((c) => p.concerns.includes(c))) score += 3;
      if (p.isBestseller) score += 1.2;
      if (p.isNew) score += 0.4;
      score += budgetRank(p.price, input.budget);
      const hay = `${p.name} ${p.nameAr} ${p.benefitsAr.join(" ")}`.toLowerCase();
      for (const t of input.tags) {
        if (t.length > 2 && hay.includes(t.toLowerCase())) score += 0.8;
      }
      if (input.freeText) {
        const ft = input.freeText.toLowerCase();
        if (ft.split(/\s+/).some((w) => w.length > 2 && hay.includes(w))) {
          score += 1.5;
        }
      }
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);

  const picked =
    scored.filter((s) => s.score > 0).slice(0, 4).map((s) => s.p).length > 0
      ? scored.filter((s) => s.score > 0).slice(0, 4).map((s) => s.p)
      : products.filter((p) => p.isBestseller).slice(0, 3);

  const ritualSteps = buildRitualSteps(category, picked);
  const ritualNote =
    "رتّبت لكِ الخطوات من الأخف للأثقل — ابدئي بلطف وراقبي بشرتكِ.";

  return { products: picked, ritualSteps, ritualNote, understood };
}

function buildRitualSteps(
  category: string,
  products: Product[],
): string[] {
  if (category === "hair-care") {
    return [
      "نظّفي الفروة بلطف",
      "طبّقي العلاج أو الماسك حسب الحاجة",
      "أنهّي بترطيب خفيف يحمي من الجفاف",
    ];
  }
  if (category === "makeup") {
    return [
      "بشرة نظيفة ومرطّبة بخفة",
      "الأساس أو اللون الأساسي",
      "لمسات العيون أو الشفاه",
      "تثبيت خفيف إن لزم",
    ];
  }
  if (category === "body-care") {
    return [
      "بعد الاستحمام على بشرة رطبة",
      "طبقة ترطيب أو زيت",
      "لمسة عطر خفيفة على النبضات إن رغبتِ",
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
