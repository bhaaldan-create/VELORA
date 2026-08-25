import { cache } from "react";
import { prisma } from "@/lib/db";
import { listStoredOrders } from "@/lib/orders";
import type { StoredOrder } from "@/lib/order-types";
import {
  analyzeProductCost,
  salePriceIqd,
  type ProductCostBreakdown,
} from "@/lib/finance/product-cost";

export type DateRange = { from: Date; to: Date };

export type PeriodKey =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom";

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolvePeriod(
  key: PeriodKey,
  customFrom?: string,
  customTo?: string,
): DateRange {
  const now = new Date();
  const today = startOfDay(now);

  switch (key) {
    case "today":
      return { from: today, to: now };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: y, to: today };
    }
    case "last7": {
      const f = new Date(today);
      f.setDate(f.getDate() - 6);
      return { from: f, to: now };
    }
    case "last30": {
      const f = new Date(today);
      f.setDate(f.getDate() - 29);
      return { from: f, to: now };
    }
    case "thisMonth":
      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: now,
      };
    case "lastMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to };
    }
    case "thisYear":
      return { from: new Date(today.getFullYear(), 0, 1), to: now };
    case "custom": {
      const from = customFrom ? startOfDay(new Date(customFrom)) : daysAgo(30);
      const to = customTo ? endOfDay(new Date(customTo)) : now;
      return { from, to };
    }
    default:
      return { from: daysAgo(30), to: now };
  }
}

function daysAgo(n: number) {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function orderTotal(order: StoredOrder): number {
  return (
    order.order.total ??
    order.order.subtotal + (order.order.deliveryFee ?? 0)
  );
}

function inRange(iso: string, range: DateRange) {
  const t = new Date(iso).getTime();
  return t >= range.from.getTime() && t < range.to.getTime();
}

const CANCELLED = new Set(["cancelled", "failed_delivery", "returned"]);

export type BusinessOverview = {
  range: { from: string; to: string };
  revenue: number;
  netSales: number;
  orders: number;
  pendingOrders: number;
  cancelledOrders: number;
  returns: number;
  refunds: number;
  unitsSold: number;
  aov: number;
  cogs: number | null;
  cogsKnownShare: number;
  grossProfit: number | null;
  grossMarginPct: number | null;
  operatingExpenses: number;
  payroll: number;
  importCosts: number;
  netProfit: number | null;
  netMarginPct: number | null;
  productsInStock: number;
  lowStock: number;
  outOfStock: number;
  inventoryRetailValue: number;
  inventoryCostValue: number | null;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  revenueSeries: { date: string; value: number }[];
  ordersSeries: { date: string; value: number }[];
  profitSeries: { date: string; value: number | null }[];
  expensesSeries: { date: string; value: number }[];
  salesByCategory: { key: string; revenue: number; units: number }[];
  salesByBrand: { key: string; revenue: number; units: number }[];
  salesByProduct: { key: string; name: string; revenue: number; units: number }[];
  insufficientCostNote: string | null;
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export const getBusinessOverview = cache(async function getBusinessOverview(
  period: PeriodKey = "last30",
  customFrom?: string,
  customTo?: string,
): Promise<BusinessOverview> {
  const range = resolvePeriod(period, customFrom, customTo);
  // Widen slightly so timezone edge days aren't dropped; still far cheaper than all-time
  const orderFrom = new Date(range.from.getTime() - 2 * 86400_000);

  const [orders, products, expenses, shipments, payrollAgg, pendingOrders] =
    await Promise.all([
      listStoredOrders({ from: orderFrom, to: range.to }),
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          nameAr: true,
          brandName: true,
          categorySlug: true,
          stock: true,
          price: true,
          discountPercent: true,
          costCurrency: true,
          costExchangeRate: true,
          purchasePrice: true,
          shippingCostIqd: true,
          customsCostIqd: true,
          brokerageCostIqd: true,
          handlingCostIqd: true,
          otherCostIqd: true,
          landedCostIqd: true,
          minMarginPct: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: range.from.toISOString().slice(0, 10),
            lt: range.to.toISOString().slice(0, 10),
          },
        },
      }),
      prisma.importShipment.findMany({
        where: {
          OR: [
            {
              receivedDate: {
                gte: range.from.toISOString().slice(0, 10),
                lt: range.to.toISOString().slice(0, 10),
              },
            },
            {
              AND: [
                { receivedDate: "" },
                { createdAt: { gte: range.from, lt: range.to } },
              ],
            },
          ],
        },
        select: {
          id: true,
          totalLandedIqd: true,
          receivedDate: true,
          createdAt: true,
        },
      }),
      prisma.employee.aggregate({
        where: { isActive: true },
        _sum: { baseSalary: true },
      }),
      prisma.order.count({
        where: {
          status: {
            in: ["new", "confirmed", "preparing", "ready_to_ship"],
          },
        },
      }),
    ]);

  const periodOrders = orders.filter((o) => inRange(o.savedAt, range));
  const activeOrders = periodOrders.filter((o) => !CANCELLED.has(o.status));
  const cancelledOrders = periodOrders.filter((o) => o.status === "cancelled").length;
  const returns = periodOrders.filter((o) => o.status === "returned").length;

  const productMap = new Map(products.map((p) => [p.id, p]));
  let revenue = 0;
  let unitsSold = 0;
  let cogsKnown = 0;
  let cogsUnknownUnits = 0;
  let cogs = 0;
  const byCat = new Map<string, { revenue: number; units: number }>();
  const byBrand = new Map<string, { revenue: number; units: number }>();
  const byProduct = new Map<string, { name: string; revenue: number; units: number }>();
  const revByDay = new Map<string, number>();
  const ordByDay = new Map<string, number>();
  const profitByDay = new Map<string, { profit: number; known: boolean }>();

  for (const o of activeOrders) {
    const total = orderTotal(o);
    revenue += total;
    const dk = dayKey(o.savedAt);
    revByDay.set(dk, (revByDay.get(dk) || 0) + total);
    ordByDay.set(dk, (ordByDay.get(dk) || 0) + 1);

    let orderCogs = 0;
    let orderHasUnknown = false;

    for (const item of o.order.items || []) {
      const qty = item.quantity || 1;
      const lineRev = (item.price || 0) * qty;
      unitsSold += qty;
      const p = productMap.get(item.id);
      const cat = p?.categorySlug || "unknown";
      const brand = p?.brandName || "—";
      const name = p?.nameAr || item.nameAr || item.name || item.id;

      const catRow = byCat.get(cat) || { revenue: 0, units: 0 };
      catRow.revenue += lineRev;
      catRow.units += qty;
      byCat.set(cat, catRow);

      const brandRow = byBrand.get(brand) || { revenue: 0, units: 0 };
      brandRow.revenue += lineRev;
      brandRow.units += qty;
      byBrand.set(brand, brandRow);

      const prodRow = byProduct.get(item.id) || { name, revenue: 0, units: 0 };
      prodRow.revenue += lineRev;
      prodRow.units += qty;
      byProduct.set(item.id, prodRow);

      if (!p) {
        orderHasUnknown = true;
        cogsUnknownUnits += qty;
        continue;
      }
      const analysis = analyzeProductCost(p);
      if (!analysis.hasCostData) {
        orderHasUnknown = true;
        cogsUnknownUnits += qty;
      } else {
        orderCogs += analysis.landedCostIqd * qty;
        cogsKnown += qty;
      }
    }

    cogs += orderCogs;
    const dayP = profitByDay.get(dk) || { profit: 0, known: true };
    if (orderHasUnknown) dayP.known = false;
    else dayP.profit += total - orderCogs;
    profitByDay.set(dk, dayP);
  }

  const operatingExpenses = expenses.reduce((s, e) => s + e.amountIqd, 0);
  const importCosts = shipments.reduce((s, sh) => s + sh.totalLandedIqd, 0);
  // Approximate monthly payroll for the period (pro-rate by days)
  const monthPayroll = payrollAgg._sum.baseSalary || 0;
  const dayCount = Math.max(
    1,
    Math.ceil((range.to.getTime() - range.from.getTime()) / (86400 * 1000)),
  );
  const payroll = Math.round((monthPayroll * Math.min(dayCount, 30)) / 30);

  const allCostKnown = cogsUnknownUnits === 0 && unitsSold > 0;
  const someCostKnown = cogsKnown > 0;
  const grossProfit =
    unitsSold === 0
      ? 0
      : someCostKnown
        ? Math.round(revenue - cogs)
        : null;
  const grossMarginPct =
    grossProfit !== null && revenue > 0
      ? Math.round((grossProfit / revenue) * 10000) / 100
      : unitsSold === 0
        ? 0
        : null;

  const netProfit =
    grossProfit === null
      ? null
      : Math.round(grossProfit - operatingExpenses - payroll);

  const netMarginPct =
    netProfit !== null && revenue > 0
      ? Math.round((netProfit / revenue) * 10000) / 100
      : unitsSold === 0
        ? 0
        : null;

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const productsInStock = products.filter((p) => p.stock > 0).length;
  const inventoryRetailValue = products.reduce(
    (s, p) => s + salePriceIqd(p.price, p.discountPercent) * Math.max(0, p.stock),
    0,
  );
  let costValue = 0;
  let costGaps = 0;
  for (const p of products) {
    const a = analyzeProductCost(p);
    if (a.hasCostData) costValue += a.landedCostIqd * Math.max(0, p.stock);
    else if (p.stock > 0) costGaps += 1;
  }

  const paidOrders = activeOrders.filter(
    (o) =>
      o.order.paymentStatus === "paid" ||
      o.status === "delivered",
  );
  const cashIn = paidOrders.reduce((s, o) => s + orderTotal(o), 0);
  const cashOut = operatingExpenses + payroll + importCosts;

  const seriesDays: string[] = [];
  const cursor = new Date(range.from);
  while (cursor < range.to && seriesDays.length < 92) {
    seriesDays.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    revenue: Math.round(revenue),
    netSales: Math.round(revenue),
    orders: activeOrders.length,
    pendingOrders,
    cancelledOrders,
    returns,
    refunds: 0,
    unitsSold,
    aov: activeOrders.length
      ? Math.round(revenue / activeOrders.length)
      : 0,
    cogs: someCostKnown ? Math.round(cogs) : null,
    cogsKnownShare: unitsSold ? cogsKnown / unitsSold : 1,
    grossProfit,
    grossMarginPct,
    operatingExpenses: Math.round(operatingExpenses),
    payroll,
    importCosts: Math.round(importCosts),
    netProfit,
    netMarginPct,
    productsInStock,
    lowStock,
    outOfStock,
    inventoryRetailValue: Math.round(inventoryRetailValue),
    inventoryCostValue: costGaps === 0 ? Math.round(costValue) : null,
    cashIn: Math.round(cashIn),
    cashOut: Math.round(cashOut),
    netCashFlow: Math.round(cashIn - cashOut),
    revenueSeries: seriesDays.map((d) => ({
      date: d,
      value: revByDay.get(d) || 0,
    })),
    ordersSeries: seriesDays.map((d) => ({
      date: d,
      value: ordByDay.get(d) || 0,
    })),
    profitSeries: seriesDays.map((d) => {
      const row = profitByDay.get(d);
      if (!row) return { date: d, value: 0 };
      return { date: d, value: row.known ? Math.round(row.profit) : null };
    }),
    expensesSeries: seriesDays.map((d) => ({
      date: d,
      value: expenses
        .filter((e) => e.date === d)
        .reduce((s, e) => s + e.amountIqd, 0),
    })),
    salesByCategory: [...byCat.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    salesByBrand: [...byBrand.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    salesByProduct: [...byProduct.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20),
    insufficientCostNote:
      !allCostKnown && unitsSold > 0
        ? "بعض المبيعات بلا تكلفة واصلة مسجّلة — الربح الإجمالي غير مكتمل."
        : null,
  };
});

export type ProductProfitRow = {
  productId: string;
  nameAr: string;
  brandName: string;
  cost: ProductCostBreakdown;
  stock: number;
};

export async function listProductProfitability(): Promise<ProductProfitRow[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
  });
  return products.map((p) => ({
    productId: p.id,
    nameAr: p.nameAr,
    brandName: p.brandName || "—",
    stock: p.stock,
    cost: analyzeProductCost(p),
  }));
}
