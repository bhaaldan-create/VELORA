import { tool } from "ai";
import { z } from "zod";
import {
  resolveProductsByIdsOrSlugs,
  toRecommendationPayload,
} from "@/lib/advisor/catalog";

export const recommendProductsTool = tool({
  description:
    "اعرضِ منتجات VELORA المقترحة للعميلة في واجهة المتجر. استخدميها دائماً عند التوصية بمنتجات.",
  inputSchema: z.object({
    productIds: z
      .array(z.string())
      .min(1)
      .max(4)
      .describe("معرفات المنتجات (id) من الكتالوج مثل p1 أو velvet-dew-serum"),
    ritualNote: z
      .string()
      .optional()
      .describe("ملاحظة قصيرة عن ترتيب الاستخدام بالعربية"),
  }),
  execute: async ({ productIds, ritualNote }) => {
    const products = await resolveProductsByIdsOrSlugs(productIds);
    return {
      products: toRecommendationPayload(products),
      ritualNote: ritualNote ?? null,
      count: products.length,
    };
  },
});

export const advisorTools = {
  recommendProducts: recommendProductsTool,
};
