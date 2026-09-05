import { tool } from "ai";
import { z } from "zod";
import {
  getProductDetailsByIdOrSlug,
  resolveProductsByIdsOrSlugs,
  searchCatalogProducts,
  toProductDetailPayload,
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
    "ابحثي/صفّي داخل كتالوج VELORA قبل أي توصية. استخدميها دائماً عند سؤال عن منتجات أو روتين أو ميزانية أو براند. لا تخمّني منتجات بدون هذه الأداة.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("كلمات بحث عربية أو إنجليزية (سيروم، مرطب، niacinamide…)"),
    brand: z
      .string()
      .optional()
      .describe("اسم البراند إن ذُكر (Anua, COSRX, Maybelline…)"),
    category: z
      .enum(["skincare", "body-care", "hair-care", "makeup", "all"])
      .optional(),
    concerns: z.array(concernEnum).optional(),
    maxPriceIQD: z.number().optional(),
    minPriceIQD: z.number().optional(),
    bestsellersOnly: z.boolean().optional(),
    inStockOnly: z.boolean().optional(),
    limit: z.number().min(1).max(12).optional(),
  }),
  execute: async (input) => {
    const products = await searchCatalogProducts({
      query: input.query,
      brand: input.brand,
      category: input.category,
      concerns: input.concerns,
      maxPriceIQD: input.maxPriceIQD,
      minPriceIQD: input.minPriceIQD,
      bestsellersOnly: input.bestsellersOnly,
      inStockOnly: input.inStockOnly,
      limit: input.limit ?? 8,
    });
    return {
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        nameAr: p.nameAr,
        name: p.name,
        brandName: p.brandName ?? null,
        category: p.category,
        productType: p.productType ?? null,
        priceIQD: p.price,
        concerns: p.concerns,
        skinTypes: p.skinTypes ?? [],
        isBestseller: !!p.isBestseller,
        inStock: (p.stock ?? 1) > 0,
      })),
    };
  },
});

export const getProductDetailsTool = tool({
  description:
    "اجلبي تفاصيل منتج واحد من الكتالوج (مكونات، فوائد، مخزون، سعر) عبر id أو slug من نتائج searchCatalog. استخدميها قبل التوصية النهائية إن احتجتِ دقة أعلى.",
  inputSchema: z.object({
    idOrSlug: z.string().describe("id أو slug من كتالوج VELORA"),
  }),
  execute: async ({ idOrSlug }) => {
    const product = await getProductDetailsByIdOrSlug(idOrSlug);
    if (!product) {
      return { found: false as const, product: null, error: "المنتج غير موجود في الكتالوج" };
    }
    return { found: true as const, product: toProductDetailPayload(product) };
  },
});

export const recommendProductsTool = tool({
  description:
    "اعرضِ منتجات VELORA المقترحة في واجهة المحادثة. استخدميها فقط بعد searchCatalog وباختيار id/slug حقيقية من النتائج (1–4).",
  inputSchema: z.object({
    productIds: z
      .array(z.string())
      .min(1)
      .max(4)
      .describe("معرفات المنتجات (id أو slug) من نتائج الأدوات فقط"),
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
    if (!products.length) {
      return {
        products: [],
        ritualNote: null,
        ritualSteps: null,
        count: 0,
        error: "لم يُعثر على المنتجات — أعيدي searchCatalog بمعرّفات صحيحة",
      };
    }
    return {
      products: toRecommendationPayload(products),
      ritualNote: ritualNote ?? null,
      ritualSteps: ritualSteps ?? null,
      count: products.length,
    };
  },
});

export const buildRitualTool = tool({
  description:
    "ابنِ روتيناً مرتباً (2–4 منتجات) مع خطوات عربية بعد اختيار المنتجات من الكتالوج. استخدميها لطلبات الروتين اليومي/المسائي.",
  inputSchema: z.object({
    productIds: z
      .array(z.string())
      .min(2)
      .max(4)
      .describe("id أو slug من نتائج searchCatalog بالترتيب المقترح للاستخدام"),
    timeOfDay: z
      .enum(["morning", "evening", "both"])
      .optional()
      .describe("صباح / مساء / كلاهما"),
    ritualNote: z.string().optional(),
    ritualSteps: z.array(z.string()).min(2).max(5),
  }),
  execute: async ({ productIds, timeOfDay, ritualNote, ritualSteps }) => {
    const products = await resolveProductsByIdsOrSlugs(productIds);
    if (products.length < 2) {
      return {
        ok: false as const,
        products: [],
        count: products.length,
        error: "يلزم منتجان على الأقل من الكتالوج",
      };
    }
    const defaultNote =
      timeOfDay === "morning"
        ? "روتين صباحي خفيف يناسب مناخ العراق — لا تنسي الحماية من الشمس."
        : timeOfDay === "evening"
          ? "روتين مسائي لطيف لإعادة الترطيب بعد يوم حار/مغبر."
          : "رتّبت الخطوات من التنظيف إلى الترطيب؛ عدّلي حسب تحمّل بشرتكِ.";
    return {
      ok: true as const,
      products: toRecommendationPayload(products),
      ritualNote: ritualNote ?? defaultNote,
      ritualSteps,
      count: products.length,
      timeOfDay: timeOfDay ?? "both",
    };
  },
});

export const advisorTools = {
  searchCatalog: searchCatalogTool,
  getProductDetails: getProductDetailsTool,
  recommendProducts: recommendProductsTool,
  buildRitual: buildRitualTool,
};
