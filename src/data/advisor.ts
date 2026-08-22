import type { Product, SkinConcern } from "@/types";
import { getAllProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";

const concernLabels: Record<SkinConcern, string> = {
  hydration: "ترطيب وامتلاء",
  glow: "إشراقة ولمعان",
  acne: "تنقية وحبوب",
  "anti-aging": "تماسك وخطوط دقيقة",
  sensitivity: "هدوء وراحة",
  "oil-control": "توازن ولمعان زائد",
};

export async function recommendProducts(message: string): Promise<Product[]> {
  const products = await getAllProducts();
  const lower = message.toLowerCase();
  const matchedConcerns = (Object.keys(concernLabels) as SkinConcern[]).filter(
    (c) =>
      lower.includes(c) ||
      (c === "anti-aging" &&
        /(aging|wrinkle|تجاعيد|شيخوخة|خطوط)/i.test(lower)) ||
      (c === "hydration" && /(dry|جفاف|ترطيب|نشفة)/i.test(lower)) ||
      (c === "acne" && /(acne|حبوب|بثور|مسام)/i.test(lower)) ||
      (c === "glow" && /(glow|إشراقة|باهتة|dull|نضارة)/i.test(lower)) ||
      (c === "sensitivity" && /(sensitive|حساسة|تحسس|احمرار)/i.test(lower)) ||
      (c === "oil-control" && /(oily|دهنية|لمعان زائد)/i.test(lower)),
  );

  const categoryHints = [
    {
      key: "skincare",
      words: [
        "skin",
        "بشرة",
        "face",
        "وجه",
        "serum",
        "moisturizer",
        "سيروم",
        "مرطب",
        "غسول",
      ],
    },
    { key: "body-care", words: ["body", "جسم", "oil", "lotion", "زيت"] },
    { key: "hair-care", words: ["hair", "شعر", "scalp", "فروة", "تالف"] },
    {
      key: "makeup",
      words: [
        "makeup",
        "مكياج",
        "blush",
        "foundation",
        "mascara",
        "فاونديشن",
        "بلاش",
      ],
    },
  ] as const;

  const matchedCategory = categoryHints.find((c) =>
    c.words.some((w) => lower.includes(w)),
  )?.key;

  let scored = products.map((p) => {
    let score = 0;
    if (matchedConcerns.some((c) => p.concerns.includes(c))) score += 3;
    if (matchedCategory && p.category === matchedCategory) score += 2;
    if (p.isBestseller) score += 1;
    if (p.isNew) score += 0.5;
    return { p, score };
  });

  scored = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (scored.length === 0) {
    return products.filter((p) => p.isBestseller).slice(0, 3);
  }
  return scored.slice(0, 3).map((s) => s.p);
}

export async function buildAdvisorReply(message: string): Promise<string> {
  const trimmed = message.trim();
  const recs = await recommendProducts(trimmed || "ترطيب");
  const lines = recs.map(
    (p, i) =>
      `${i + 1}) ${p.nameAr} — ${formatPrice(p.price)} · ${p.benefitsAr.slice(0, 2).join("، ")}`,
  );

  if (!trimmed || /مرحبا|السلام|hello|hi|hey|هلا/i.test(trimmed)) {
    return `أهلاً بكِ في VELORA — أنا لارسا، مستشارتكِ الجمالية.

صفي لي بشرتكِ أو هدفكِ (ترطيب، إشراقة، حبوب، شعر، مكياج، جسم…) وسأبني طقساً واضحاً من منتجات متجرنا فقط، مع مراعاة مناخ العراق.

يمكنكِ البدء بـ: «بشرتي جافة وباهتة» أو «روتين صباحي من 3 خطوات».`;
  }

  if (/سعر|غالي|رخيص|ميزانية|كم|دينار|price/i.test(trimmed)) {
    return `إليكِ خيارات من مجموعة VELORA بأسعار الدينار العراقي:

${lines.join("\n")}

افتحي أي منتج للتفاصيل، أو حدّثيني عن ميزانيتكِ وهدفكِ لأضبط الاختيار أكثر.`;
  }

  if (/روتين|خطوات|صباح|مساء|routine/i.test(trimmed)) {
    const names = recs.map((p) => p.nameAr).join(" ← ");
    return `طقسكِ المقترح من VELORA:

1) تنظيف لطيف
2) علاج مركّز (سيروم/إكسير)
3) ترطيب
4) حماية (نهاراً)

اقتراحي الحالي حسب وصفكِ:
${lines.join("\n")}

ترتيب سريع: ${names}

هل تفضّلين نسخة للصباح أم للمساء؟`;
  }

  if (/شعر|تالف|فروة|hair/i.test(trimmed)) {
    return `لفروة الشعر والشعر المجهد، أختار من عناية الشعر في VELORA:

${lines.join("\n")}

نصيحة سريعة: ركّزي على الفروة أسبوعياً، والماسك على الأطوال. هل شعركِ جاف، دهني من الجذور، أم تالف من الصبغ؟`;
  }

  if (/مكياج|فاونديشن|بلاش|ماسكارا|makeup/i.test(trimmed)) {
    return `لمكياج يبدو طبيعياً وراقياً من مجموعة VELORA:

${lines.join("\n")}

هل تريدين تغطية خفيفة يومية أم إطلالة أكثر اكتمالاً؟`;
  }

  return `فهمتُ احتياجكِ. هذه اختياراتي من متجر VELORA فقط:

${lines.join("\n")}

كل منتج مختار لنتائج واضحة وملمس فاخر. اضغطي على البطاقة لفتح التفاصيل، أو أخبريني أكثر (نوع بشرتكِ / حساسية / صباح أو مساء) لأتقن الطقس.`;
}
