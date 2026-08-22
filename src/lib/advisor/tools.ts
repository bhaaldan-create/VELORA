import { tool } from "ai";
import { z } from "zod";
import {
  resolveProductsByIdsOrSlugs,
  searchCatalogProducts,
  toRecommendationPayload,
} from "@/lib/advisor/catalog";

const concernEnum = z.enum([
  "hydration",
  "glow",
  "acne",
  "anti-aging",
  "sensitivity",
  "oil-control",
]);

export const searchCatalogTool = tool({
  description:
    "ابحثي/صفّي داخل كتالوج VELORA قبل التوصية (فئة، اهتمام، ميزانية، كلمات). استخدميها عندما يكون الطلب عاماً أو يحتاج تصفية.",
  inputSchema: z.object({
    query: z.string().optional().describe("كلمات بحث عربية أو إنجليزية"),
    category: z
      .enum(["skincare", "body-care", "hair-care", "makeup", "fragrance", "all"])
      .optional(),
    concerns: z.array(concernEnum).optional(),
    maxPriceIQD: z.number().optional(),
    minPriceIQD: z.number().optional(),
    bestsellersOnly: z.boolean().optional(),
    limit: z.number().min(1).max(12).optional(),
  }),
  execute: async (input) => {
    const products = await searchCatalogProducts({
      query: input.query,
      category: input.category,
      concerns: input.concerns,
      maxPriceIQD: input.maxPriceIQD,
      minPriceIQD: input.minPriceIQD,
      bestsellersOnly: input.bestsellersOnly,
      limit: input.limit ?? 8,
    });
    return {
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        nameAr: p.nameAr,
        name: p.name,
        category: p.category,
        priceIQD: p.price,
        concerns: p.concerns,
        isBestseller: !!p.isBestseller,
      })),
    };
  },
});

export const recommendProductsTool = tool({
  description:
    "اعرضِ منتجات VELORA المقترحة في واجهة المحادثة. استخدميها دائماً عند التوصية النهائية بالمنتجات.",
  inputSchema: z.object({
    productIds: z
      .array(z.string())
      .min(1)
      .max(4)
      .describe("معرفات المنتجات (id أو slug) من الكتالوج"),
    ritualNote: z
      .string()
      .optional()
      .describe("ملاحظة قصيرة عن ترتيب الاستخدام بالعربية"),
    ritualSteps: z
      .array(z.string())
      .max(5)
      .optional()
      .describe("خطوات الروتين بالعربية إن وُجد"),
  }),
  execute: async ({ productIds, ritualNote, ritualSteps }) => {
    const products = await resolveProductsByIdsOrSlugs(productIds);
    return {
      products: toRecommendationPayload(products),
      ritualNote: ritualNote ?? null,
      ritualSteps: ritualSteps ?? null,
      count: products.length,
    };
  },
});

export const advisorTools = {
  searchCatalog: searchCatalogTool,
  recommendProducts: recommendProductsTool,
};
