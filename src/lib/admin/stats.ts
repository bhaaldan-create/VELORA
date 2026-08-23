import { prisma } from "@/lib/db";
import { listStoredOrders } from "@/lib/orders";
import type { OrderStatus, StoredOrder } from "@/lib/order-types";

function orderTotal(order: StoredOrder): number {
  return (
    order.order.total ??
    order.order.subtotal + (order.order.deliveryFee ?? 0)
  );
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function inRange(iso: string, from: Date, to: Date) {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t < to.getTime();
}

export type AdminKpi = {
  id: string;
  label: string;
  value: number;
  format: "iqd" | "number";
  deltaPct: number | null;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

export type AdminOverview = {
  greetingName: string;
  kpis: AdminKpi[];
  statusBreakdown: { status: OrderStatus; count: number }[];
  attention: {
    newOrders: number;
    preparing: number;
    shipping: number;
    lowStock: number;
    unpaid: number;
  };
  recentOrders: StoredOrder[];
  todaySales: number;
  todayOrders: number;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const [orders, products, customers] = await Promise.all([
    listStoredOrders(),
    prisma.product.findMany({
      select: { id: true, stock: true, price: true, isActive: true },
    }),
    prisma.customer.count(),
  ]);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = daysAgo(7);
  const prevWeekStart = daysAgo(14);

  const thisWeek = orders.filter((o) =>
    inRange(o.savedAt, weekStart, now),
  );
  const prevWeek = orders.filter((o) =>
    inRange(o.savedAt, prevWeekStart, weekStart),
  );
  const today = orders.filter((o) => inRange(o.savedAt, todayStart, now));

  const sum = (list: StoredOrder[]) =>
    list.reduce((acc, o) => acc + orderTotal(o), 0);

  const thisWeekSales = sum(thisWeek);
  const prevWeekSales = sum(prevWeek);
  const salesDelta =
    prevWeekSales > 0
      ? ((thisWeekSales - prevWeekSales) / prevWeekSales) * 100
      : thisWeekSales > 0
        ? 100
        : null;

  const ordersDelta =
    prevWeek.length > 0
      ? ((thisWeek.length - prevWeek.length) / prevWeek.length) * 100
      : thisWeek.length > 0
        ? 100
        : null;

  const aov =
    thisWeek.length > 0 ? Math.round(thisWeekSales / thisWeek.length) : 0;
  const prevAov =
    prevWeek.length > 0 ? Math.round(sum(prevWeek) / prevWeek.length) : 0;
  const aovDelta =
    prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : aov > 0 ? 100 : null;

  const byStatus = (s: OrderStatus | OrderStatus[]) => {
    const set = new Set(Array.isArray(s) ? s : [s]);
    return orders.filter((o) => set.has(o.status)).length;
  };

  const shippingStatuses: OrderStatus[] = [
    "handed_to_courier",
    "in_transit",
    "out_for_delivery",
  ];

  const lowStock = products.filter(
    (p) => p.isActive && p.stock > 0 && p.stock <= 10,
  ).length;

  const unpaid = orders.filter(
    (o) =>
      o.order.paymentStatus === "pending" ||
      o.order.paymentStatus === "unpaid",
  ).length;

  const statusBreakdown: AdminOverview["statusBreakdown"] = (
    [
      "new",
      "confirmed",
      "preparing",
      "ready_to_ship",
      "handed_to_courier",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "deferred",
      "cancelled",
      "returned",
      "failed_delivery",
    ] as OrderStatus[]
  )
    .map((status) => ({
      status,
      count: orders.filter((o) => o.status === status).length,
    }))
    .filter((x) => x.count > 0);

  return {
    greetingName: "فريق VELORA",
    todaySales: sum(today),
    todayOrders: today.length,
    kpis: [
      {
        id: "sales",
        label: "إجمالي المبيعات",
        value: thisWeekSales,
        format: "iqd",
        deltaPct: salesDelta,
        tone: "default",
      },
      {
        id: "orders",
        label: "الطلبات",
        value: orders.length,
        format: "number",
        deltaPct: ordersDelta,
      },
      {
        id: "new",
        label: "طلبات جديدة",
        value: byStatus("new"),
        format: "number",
        deltaPct: null,
        tone: "info",
      },
      {
        id: "preparing",
        label: "قيد التجهيز",
        value: byStatus(["preparing", "confirmed", "ready_to_ship"]),
        format: "number",
        deltaPct: null,
        tone: "warning",
      },
      {
        id: "shipping",
        label: "قيد التوصيل",
        value: byStatus(shippingStatuses),
        format: "number",
        deltaPct: null,
        tone: "info",
      },
      {
        id: "delivered",
        label: "تم التسليم",
        value: byStatus("delivered"),
        format: "number",
        deltaPct: null,
        tone: "success",
      },
      {
        id: "customers",
        label: "العملاء",
        value: customers,
        format: "number",
        deltaPct: null,
      },
      {
        id: "aov",
        label: "قيمة السلة المتوسطة",
        value: aov,
        format: "iqd",
        deltaPct: aovDelta,
      },
    ],
    statusBreakdown,
    attention: {
      newOrders: byStatus("new"),
      preparing: byStatus(["preparing", "confirmed", "ready_to_ship"]),
      shipping: byStatus(shippingStatuses),
      lowStock,
      unpaid,
    },
    recentOrders: orders.slice(0, 8),
  };
}
