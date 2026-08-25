import { prisma } from "@/lib/db";
import { analyzeProductCost } from "@/lib/finance/product-cost";

export async function generateRuleInsights() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  const created: string[] = [];

  // Clear old non-dismissed auto insights of same kinds to avoid spam
  await prisma.aiInsight.deleteMany({
    where: {
      dismissedAt: null,
      kind: { in: ["stock", "low_margin", "dead_stock"] },
    },
  });

  for (const p of products) {
    if (p.stock <= 0) {
      const row = await prisma.aiInsight.create({
        data: {
          kind: "stock",
          severity: "critical",
          titleAr: `نفاد المخزون: ${p.nameAr}`,
          titleEn: `Out of stock: ${p.name}`,
          bodyAr: `المنتج «${p.nameAr}» غير متوفر حالياً.`,
          bodyEn: `Product "${p.name}" is out of stock.`,
          whyAr: "الرصيد الحالي = 0.",
          whyEn: "Current stock equals 0.",
          evidenceJson: { productId: p.id, stock: p.stock },
          entityType: "Product",
          entityId: p.id,
        },
      });
      created.push(row.id);
    } else if (p.stock <= 10) {
      const row = await prisma.aiInsight.create({
        data: {
          kind: "stock",
          severity: "high",
          titleAr: `مخزون منخفض: ${p.nameAr}`,
          titleEn: `Low stock: ${p.name}`,
          bodyAr: `يتبقى ${p.stock} وحدة فقط من «${p.nameAr}».`,
          bodyEn: `Only ${p.stock} units left of "${p.name}".`,
          whyAr: "الرصيد ≤ 10 وحدات.",
          whyEn: "Stock is ≤ 10 units.",
          evidenceJson: { productId: p.id, stock: p.stock },
          entityType: "Product",
          entityId: p.id,
        },
      });
      created.push(row.id);
    }

    const cost = analyzeProductCost(p);
    if (cost.hasCostData && cost.belowMinMargin && cost.grossMarginPct !== null) {
      const row = await prisma.aiInsight.create({
        data: {
          kind: "low_margin",
          severity: cost.grossMarginPct < 0 ? "critical" : "medium",
          titleAr: `هامش منخفض: ${p.nameAr}`,
          titleEn: `Low margin: ${p.name}`,
          bodyAr: `الهامش الإجمالي ${cost.grossMarginPct}% أقل من الحد الأدنى ${p.minMarginPct}%.`,
          bodyEn: `Gross margin ${cost.grossMarginPct}% is below minimum ${p.minMarginPct}%.`,
          whyAr: cost.explanationAr,
          whyEn: cost.explanationEn,
          evidenceJson: {
            productId: p.id,
            landedCostIqd: cost.landedCostIqd,
            netSellingPrice: cost.netSellingPrice,
            grossMarginPct: cost.grossMarginPct,
          },
          entityType: "Product",
          entityId: p.id,
        },
      });
      created.push(row.id);
    }
  }

  return created.length;
}
