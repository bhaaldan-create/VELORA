import { generateText } from "ai";
import { getAdvisorModel, getAdvisorProvider } from "@/lib/advisor/model";
import { assertAdminModule } from "@/lib/admin/guard";
import {
  getBusinessOverview,
  listProductProfitability,
} from "@/lib/finance/overview";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const gate = await assertAdminModule("ai");
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const question = String(body?.question || body?.message || "").trim();
  if (!question) {
    return Response.json({ ok: false, error: "أدخلي سؤالاً." }, { status: 400 });
  }

  const [overview, lastMonth, profitability] = await Promise.all([
    getBusinessOverview("thisMonth"),
    getBusinessOverview("lastMonth"),
    listProductProfitability(),
  ]);

  const topProfit = profitability
    .filter((p) => p.cost.hasCostData && p.cost.grossProfit !== null)
    .sort((a, b) => (b.cost.grossProfit || 0) - (a.cost.grossProfit || 0))
    .slice(0, 10)
    .map((p) => ({
      name: p.nameAr,
      brand: p.brandName,
      margin: p.cost.grossMarginPct,
      profit: p.cost.grossProfit,
      landed: p.cost.landedCostIqd,
      sell: p.cost.netSellingPrice,
    }));

  const lowMargin = profitability
    .filter((p) => p.cost.belowMinMargin)
    .slice(0, 10)
    .map((p) => ({
      name: p.nameAr,
      margin: p.cost.grossMarginPct,
    }));

  const snapshot = {
    period: overview.range,
    revenue: overview.revenue,
    orders: overview.orders,
    aov: overview.aov,
    unitsSold: overview.unitsSold,
    grossProfit: overview.grossProfit,
    netProfit: overview.netProfit,
    expenses: overview.operatingExpenses,
    payroll: overview.payroll,
    importCosts: overview.importCosts,
    inventoryRetailValue: overview.inventoryRetailValue,
    inventoryCostValue: overview.inventoryCostValue,
    lowStock: overview.lowStock,
    outOfStock: overview.outOfStock,
    insufficientCostNote: overview.insufficientCostNote,
    topProfitProducts: topProfit,
    lowMarginProducts: lowMargin,
    salesByBrand: overview.salesByBrand.slice(0, 8),
    salesByCategory: overview.salesByCategory.slice(0, 8),
    comparison: {
      lastMonthRevenue: lastMonth.revenue,
      lastMonthOrders: lastMonth.orders,
      lastMonthGrossProfit: lastMonth.grossProfit,
      lastMonthNetProfit: lastMonth.netProfit,
    },
  };

  const model = getAdvisorModel();
  if (!model || getAdvisorProvider() === "local") {
    return Response.json({
      ok: true,
      mode: "snapshot",
      answerAr: buildFallbackAnswer(question, snapshot),
      snapshot,
      note: "لم يُضبط مفتاح نموذج الذكاء — عُرضت الأرقام الفعلية فقط بدون تحليل لغوي موسّع.",
    });
  }

  try {
    const { text } = await generateText({
      model,
      system: `You are VELORA AI Business Agent. Answer in Arabic (Iraqi retail beauty tone, formal-friendly).
STRICT RULES:
- Use ONLY the JSON snapshot numbers provided.
- NEVER invent revenue, profit, costs, or stock figures.
- If a field is null, say البيانات غير كافية.
- Distinguish Revenue vs Profit clearly.
- If comparing months, use snapshot.comparison fields only.
- End with one concrete recommended action.
Snapshot JSON:
${JSON.stringify(snapshot)}`,
      prompt: question,
    });

    return Response.json({
      ok: true,
      mode: "llm",
      answerAr: text,
      snapshot,
    });
  } catch (error) {
    console.error("[admin/ai]", error);
    return Response.json({
      ok: true,
      mode: "snapshot",
      answerAr: buildFallbackAnswer(question, snapshot),
      snapshot,
      note: "تعذّر استدعاء النموذج — عُرضت الأرقام الفعلية.",
    });
  }
}

function buildFallbackAnswer(
  question: string,
  s: {
    revenue: number;
    orders: number;
    grossProfit: number | null;
    netProfit: number | null;
    expenses: number;
    payroll: number;
    lowStock: number;
    outOfStock: number;
    insufficientCostNote: string | null;
  },
) {
  const lines = [
    `سؤالك: ${question}`,
    "",
    `إيرادات الفترة: ${s.revenue.toLocaleString("ar-IQ")} د.ع`,
    `عدد الطلبات: ${s.orders}`,
    `الربح الإجمالي: ${s.grossProfit === null ? "بيانات غير كافية" : s.grossProfit.toLocaleString("ar-IQ") + " د.ع"}`,
    `صافي الربح: ${s.netProfit === null ? "بيانات غير كافية" : s.netProfit.toLocaleString("ar-IQ") + " د.ع"}`,
    `المصروفات: ${s.expenses.toLocaleString("ar-IQ")} د.ع`,
    `الرواتب (تقديري للفترة): ${s.payroll.toLocaleString("ar-IQ")} د.ع`,
    `منخفض المخزون: ${s.lowStock} · نفاد: ${s.outOfStock}`,
  ];
  if (s.insufficientCostNote) lines.push(s.insufficientCostNote);
  lines.push("", "توصية: أكمل تكاليف المنتجات الواصلة لتفعيل حساب الربح بدقة.");
  return lines.join("\n");
}
