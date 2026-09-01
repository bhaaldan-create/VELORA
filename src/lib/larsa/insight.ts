import { generateObject } from "ai";
import { z } from "zod";
import { getAdvisorModel } from "@/lib/advisor/model";
import { buildLarsaKnowledgeBlock } from "@/data/larsa-knowledge";
import type { Product } from "@/types";
import type { LarsaRecommendInput } from "@/lib/larsa/recommend";

const insightSchema = z.object({
  introLine: z
    .string()
    .describe("جملة افتتاحية شخصية بالعربية — دافئة وقصيرة"),
  ritualSteps: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("خطوات الروتين بالعربية"),
  ritualNote: z.string().describe("ملاحظة قصيرة عن ترتيب الاستخدام"),
  productInsights: z
    .array(
      z.object({
        productId: z.string(),
        whyAr: z
          .string()
          .describe("لماذا هذا المنتج مناسب — جملة أو جملتان"),
      }),
    )
    .max(4),
});

export type LarsaInsightResult = z.infer<typeof insightSchema>;

export async function enrichLarsaRecommendations(
  input: LarsaRecommendInput,
  products: Product[],
  fallback: {
    ritualSteps: string[];
    ritualNote: string;
  },
): Promise<LarsaInsightResult | null> {
  const model = getAdvisorModel();
  if (!model || products.length === 0) return null;

  const knowledge = buildLarsaKnowledgeBlock();
  const catalogSlice = products.map((p) => ({
    id: p.id,
    nameAr: p.nameAr,
    name: p.name,
    priceIQD: p.price,
    category: p.category,
    concerns: p.concerns,
    skinTypes: p.skinTypes ?? [],
    productType: p.productType,
    benefitsAr: p.benefitsAr.slice(0, 3),
    ingredients: p.ingredients.slice(0, 5),
  }));

  try {
    const { object } = await generateObject({
      model,
      schema: insightSchema,
      temperature: 0.55,
      system: `أنتِ لارسا — مستشارة الجمال في VELORA. اكتبي بالعربية الراقية الدافئة.
${knowledge}

قواعد:
- استخدمي فقط المنتجات المعطاة — لا تختلقي منتجات.
- اربطي كل توصية باحتياج العميلة من الوسوم والنص الحر.
- راعي مناخ العراق.
- لا تشخيص طبي. لا إيموجي.`,
      prompt: `ملف الاستشارة:
- المسار: ${input.pathId}
- القسم: ${input.categoryHint}
- الميزانية: ${input.budget}
- الوسوم: ${input.tags.join("، ") || "—"}
- نص إضافي: ${input.freeText?.trim() || "—"}

المنتجات المختارة (لا تغيّريها — فقط اشرحي لماذا):
${JSON.stringify(catalogSlice, null, 2)}

خطوات افتراضية (يمكن تحسينها):
${fallback.ritualSteps.join(" → ")}`,
    });

    const validIds = new Set(products.map((p) => p.id));
    return {
      ...object,
      productInsights: object.productInsights.filter((pi) =>
        validIds.has(pi.productId),
      ),
    };
  } catch (error) {
    console.error("[larsa/insight] AI enrichment failed", error);
    return null;
  }
}
