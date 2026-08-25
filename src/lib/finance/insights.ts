import { prisma } from "@/lib/db";
import { analyzeProductCost } from "@/lib/finance/product-cost";
import { listStoredOrders } from "@/lib/orders";

export async function generateRuleInsights() {
  const [products, orders] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true } }),
    listStoredOrders({ take: 2000 }),
  ]);

  const soldIds = new Set<string>();
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "failed_delivery") continue;
    for (const item of o.order.items || []) {
      if (item.id) soldIds.add(item.id);
    }
  }

  const created: string[] = [];

  await prisma.aiInsight.deleteMany({
    where: {
      dismissedAt: null,
      kind: {
        in: ["stock", "low_margin", "dead_stock", "cost_increase", "opportunity"],
      },
    },
  });

  let missingCostCount = 0;

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
          whyAr: "الرصيد ≤ 10 وحدات. تقدير أيام النفاد غير متاح قبل وجود مبيعات كافية.",
          whyEn: "Stock ≤ 10. Depletion estimate unavailable without enough sales history.",
          evidenceJson: { productId: p.id, stock: p.stock },
          entityType: "Product",
          entityId: p.id,
        },
      });
      created.push(row.id);
    }

    const cost = analyzeProductCost(p);
    if (!cost.hasCostData && p.stock > 0) {
      missingCostCount += 1;
    }

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

    // Dead stock: on-hand inventory never appeared in any order (post wipe = all with stock)
    // Only flag when there IS some sales history in the store, otherwise everything looks "dead"
    if (orders.length > 0 && p.stock > 0 && !soldIds.has(p.id)) {
      const row = await prisma.aiInsight.create({
        data: {
          kind: "dead_stock",
          severity: "medium",
          titleAr: `مخزون راكد محتمل: ${p.nameAr}`,
          titleEn: `Possible dead stock: ${p.name}`,
          bodyAr: `يوجد ${p.stock} وحدة ولم يظهر في أي طلب ضمن السجل الحالي.`,
          bodyEn: `${p.stock} units on hand with no sales in current order history.`,
          whyAr: "لا توجد مبيعات مسجّلة لهذا المنتج بعد تنظيف بيانات الاختبار / الإطلاق.",
          whyEn: "No recorded sales for this product in the current order history.",
          evidenceJson: { productId: p.id, stock: p.stock, soldInOrders: false },
          entityType: "Product",
          entityId: p.id,
        },
      });
      created.push(row.id);
    }

    if (
      cost.hasCostData &&
      cost.grossMarginPct !== null &&
      cost.grossMarginPct >= (p.minMarginPct || 20) + 15
    ) {
      const row = await prisma.aiInsight.create({
        data: {
          kind: "opportunity",
          severity: "info",
          titleAr: `هامش قوي: ${p.nameAr}`,
          titleEn: `Strong margin: ${p.name}`,
          bodyAr: `الهامش ${cost.grossMarginPct}% أعلى بوضوح من الحد الأدنى — مرشّح للترويج.`,
          bodyEn: `Margin ${cost.grossMarginPct}% is well above minimum — promotion candidate.`,
          whyAr: cost.explanationAr,
          whyEn: cost.explanationEn,
          evidenceJson: {
            productId: p.id,
            grossMarginPct: cost.grossMarginPct,
            minMarginPct: p.minMarginPct,
          },
          entityType: "Product",
          entityId: p.id,
        },
      });
      created.push(row.id);
    }
  }

  if (missingCostCount > 0) {
    const row = await prisma.aiInsight.create({
      data: {
        kind: "cost_increase",
        severity: "high",
        titleAr: "منتجات بلا تكلفة واصلة",
        titleEn: "Products missing landed cost",
        bodyAr: `${missingCostCount} منتجاً متوفراً بلا سعر شراء/تكاليف استيراد — الربح سيظهر «غير كافٍ».`,
        bodyEn: `${missingCostCount} in-stock products lack purchase/import costs — profit shows insufficient data.`,
        whyAr: "بدون تكلفة واصلة لا يمكن حساب COGS أو الهامش بدقة.",
        whyEn: "Without landed cost, COGS and margin cannot be computed accurately.",
        evidenceJson: { missingCostCount },
        entityType: "Product",
        entityId: "",
      },
    });
    created.push(row.id);
  }

  if (orders.length === 0) {
    const row = await prisma.aiInsight.create({
      data: {
        kind: "opportunity",
        severity: "info",
        titleAr: "حالة ما قبل الإطلاق",
        titleEn: "Pre-launch state",
        bodyAr: "لا طلبات بعد. سجّلي التكاليف والموردين والاستيراد الآن لتكون التقارير جاهزة من أول بيع.",
        bodyEn: "No orders yet. Enter costs, suppliers, and imports so reports are ready from first sale.",
        whyAr: "تم تنظيف طلبات الاختبار — لوحة الأعمال نظيفة عمداً.",
        whyEn: "Test orders were wiped — analytics intentionally start at zero.",
        evidenceJson: { orders: 0 },
        entityType: "System",
        entityId: "",
      },
    });
    created.push(row.id);
  }

  return created.length;
}
