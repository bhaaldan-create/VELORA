import { prisma } from "@/lib/db";
import type { OrderItemPayload, OrderPayload } from "@/lib/order-email";
import {
  normalizeStatus,
  ORDER_STATUSES,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/order-types";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import type { Prisma } from "@/generated/prisma/client";

export type { OrderStatus, StoredOrder } from "@/lib/order-types";
export { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-types";

/** رقم طلب فريد: YYMMDDHHmmss + 3 أرقام عشوائية */
export function createOrderId() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${stamp.slice(2)}${rand}`;
}

/** طلب مرفوض لأن الكمية أكبر من المخزون، أو المنتج غير موجود / غير نشط. */
export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

const STOCK_RELEASE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "cancelled",
  "returned",
  "failed_delivery",
]);

type AggregatedStockLine = {
  id: string;
  quantity: number;
  name?: string;
  nameAr?: string;
};

function aggregateStockLines(items: OrderItemPayload[]): AggregatedStockLine[] {
  if (!Array.isArray(items)) {
    throw new InsufficientStockError("بيانات كمية المنتج غير صالحة.");
  }
  const totals = new Map<string, AggregatedStockLine>();
  for (const item of items) {
    const id = typeof item?.id === "string" ? item.id.trim() : "";
    const quantity = item?.quantity;
    if (!id || !Number.isInteger(quantity) || quantity <= 0) {
      throw new InsufficientStockError("بيانات كمية المنتج غير صالحة.");
    }
    const existing = totals.get(id);
    if (existing) {
      existing.quantity += quantity;
      continue;
    }
    totals.set(id, {
      id,
      quantity,
      name: item.name,
      nameAr: item.nameAr,
    });
  }
  return [...totals.values()];
}

function stockLineLabel(
  line: AggregatedStockLine,
  product?: { nameAr?: string | null; name?: string | null } | null,
) {
  return (
    product?.nameAr?.trim() ||
    product?.name?.trim() ||
    line.nameAr?.trim() ||
    line.name?.trim() ||
    "المنتج"
  );
}

function insufficientStockMessage(name: string, remaining?: number | null) {
  if (typeof remaining === "number") {
    return `الكمية المطلوبة من «${name}» غير متوفرة. المتبقي ${remaining}.`;
  }
  return `الكمية المطلوبة من «${name}» غير متوفرة.`;
}

function revalidateStockedProducts(slugs: string[]) {
  for (const slug of new Set(slugs.filter((value) => value.trim().length > 0))) {
    try {
      revalidateStorefront({ slug });
    } catch (error) {
      console.error("[orders] storefront revalidate failed", slug, error);
    }
  }
}

async function applyStockCommit(
  tx: Prisma.TransactionClient,
  lines: AggregatedStockLine[],
) {
  const affected: string[] = [];
  for (const line of lines) {
    const product = await tx.product.findUnique({
      where: { id: line.id },
      select: {
        id: true,
        slug: true,
        name: true,
        nameAr: true,
        stock: true,
        isActive: true,
      },
    });
    const label = stockLineLabel(line, product);
    if (!product || !product.isActive) {
      throw new InsufficientStockError(
        insufficientStockMessage(label, product?.stock),
      );
    }

    const updated = await tx.product.updateMany({
      where: {
        id: line.id,
        isActive: true,
        stock: { gte: line.quantity },
      },
      data: { stock: { decrement: line.quantity } },
    });
    if (updated.count !== 1) {
      const fresh = await tx.product.findUnique({
        where: { id: line.id },
        select: { name: true, nameAr: true, stock: true },
      });
      throw new InsufficientStockError(
        insufficientStockMessage(stockLineLabel(line, fresh), fresh?.stock),
      );
    }
    affected.push(product.slug);
  }
  return affected;
}

async function applyStockRelease(
  tx: Prisma.TransactionClient,
  lines: AggregatedStockLine[],
) {
  const affected: string[] = [];
  for (const line of lines) {
    const updated = await tx.product.updateMany({
      where: { id: line.id },
      data: { stock: { increment: line.quantity } },
    });
    if (updated.count !== 1) {
      throw new InsufficientStockError(
        insufficientStockMessage(stockLineLabel(line)),
      );
    }
    const product = await tx.product.findUnique({
      where: { id: line.id },
      select: { slug: true },
    });
    if (product?.slug) affected.push(product.slug);
  }
  return affected;
}

/** خصم كميات الطلب من المخزون. يُرفض الطلب كاملاً إذا نقص منتج واحد. */
export async function commitOrderStock(items: OrderItemPayload[]) {
  const lines = aggregateStockLines(items);
  if (lines.length === 0) return;

  const slugs = await prisma.$transaction((tx) => applyStockCommit(tx, lines));
  revalidateStockedProducts(slugs);
}

/** إعادة كميات الطلب إلى المخزون مرة واحدة. */
export async function releaseOrderStock(items: OrderItemPayload[]) {
  const lines = aggregateStockLines(items);
  if (lines.length === 0) return;

  const slugs = await prisma.$transaction((tx) => applyStockRelease(tx, lines));
  revalidateStockedProducts(slugs);
}

function rowToStored(row: {
  id: string;
  subject: string;
  emailedTo: string | null;
  status: string;
  orderJson: Prisma.JsonValue;
  text: string;
  adminNote: string | null;
  receiptSentAt: Date | null;
  savedAt: Date;
  updatedAt: Date;
}): StoredOrder | null {
  const order = row.orderJson as unknown as OrderPayload;
  if (!order || typeof order !== "object") return null;
  return {
    savedAt: row.savedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    orderId: row.id,
    subject: row.subject,
    emailedTo: row.emailedTo || undefined,
    status: normalizeStatus(row.status),
    order,
    text: row.text || "",
    adminNote: row.adminNote || undefined,
    receiptSentAt: row.receiptSentAt?.toISOString(),
  };
}

export async function saveStoredOrder(
  input: Omit<StoredOrder, "status" | "updatedAt"> & {
    status?: OrderStatus;
  },
): Promise<StoredOrder> {
  const status = input.status ?? "new";
  const savedAt = new Date(input.savedAt);
  const row = await prisma.order.upsert({
    where: { id: input.orderId },
    create: {
      id: input.orderId,
      subject: input.subject,
      emailedTo: input.emailedTo || null,
      status,
      orderJson: input.order as unknown as Prisma.InputJsonValue,
      text: input.text || "",
      adminNote: input.adminNote || null,
      receiptSentAt: input.receiptSentAt
        ? new Date(input.receiptSentAt)
        : null,
      savedAt: Number.isNaN(savedAt.getTime()) ? new Date() : savedAt,
    },
    update: {
      subject: input.subject,
      emailedTo: input.emailedTo || null,
      status,
      orderJson: input.order as unknown as Prisma.InputJsonValue,
      text: input.text || "",
      adminNote: input.adminNote || null,
      receiptSentAt: input.receiptSentAt
        ? new Date(input.receiptSentAt)
        : null,
    },
  });

  const stored = rowToStored(row);
  if (!stored) throw new Error("تعذّر حفظ الطلب.");
  return stored;
}

export async function getStoredOrder(
  orderId: string,
): Promise<StoredOrder | null> {
  const row = await prisma.order.findUnique({ where: { id: orderId } });
  if (!row) return null;
  return rowToStored(row);
}

export async function listStoredOrders(opts?: {
  /** Inclusive lower bound on savedAt */
  from?: Date;
  /** Exclusive upper bound on savedAt */
  to?: Date;
  /** Cap rows for dashboards (newest first) */
  take?: number;
}): Promise<StoredOrder[]> {
  const rows = await prisma.order.findMany({
    where:
      opts?.from || opts?.to
        ? {
            savedAt: {
              ...(opts.from ? { gte: opts.from } : {}),
              ...(opts.to ? { lt: opts.to } : {}),
            },
          }
        : undefined,
    orderBy: { savedAt: "desc" },
    ...(opts?.take ? { take: opts.take } : {}),
  });
  return rows
    .map(rowToStored)
    .filter((o): o is StoredOrder => o !== null);
}

async function maybeGenerateVeloraCard(stored: StoredOrder): Promise<void> {
  try {
    const { isMyVeloraEligibleOrder } = await import("@/lib/my-velora/eligibility");
    if (!isMyVeloraEligibleOrder(stored)) return;

    const customerId = stored.order.customerId;
    const email = (stored.order.email || "").trim().toLowerCase();
    if (!customerId && !email) return;

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && email) {
      const customer = await prisma.customer.findUnique({
        where: { email },
        select: { id: true },
      });
      resolvedCustomerId = customer?.id;
    }
    if (!resolvedCustomerId) return;

    const { ensureVeloraCardForOrder } = await import("@/lib/my-velora/generate");
    await ensureVeloraCardForOrder({
      entry: stored,
      customerId: resolvedCustomerId,
    });
  } catch (err) {
    console.error("[my-velora] card generation failed:", err);
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  opts?: { adminNote?: string; markReceiptSent?: boolean },
): Promise<StoredOrder | null> {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return null;

  const current = rowToStored(existing);
  const releasing = STOCK_RELEASE_STATUSES.has(status);
  const mayAdjustStock = Boolean(
    current?.order.stockHeld &&
      ((releasing && !current.order.stockReleased) ||
        (!releasing && current.order.stockReleased)),
  );

  const adminNote =
    typeof opts?.adminNote === "string"
      ? opts.adminNote.trim() || null
      : existing.adminNote;
  const receiptSentAt = opts?.markReceiptSent
    ? new Date()
    : existing.receiptSentAt;

  const { row, slugs } = await (async () => {
    if (!mayAdjustStock || !current) {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status, adminNote, receiptSentAt },
      });
      return { row: updated, slugs: [] as string[] };
    }

    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
      const fresh = await tx.order.findUnique({ where: { id: orderId } });
      if (!fresh) return { row: null, slugs: [] as string[] };

      const freshStored = rowToStored(fresh);
      const freshOrder = freshStored?.order;
      const shouldRelease = Boolean(
        freshOrder?.stockHeld && releasing && !freshOrder.stockReleased,
      );
      const shouldCommit = Boolean(
        freshOrder?.stockHeld && !releasing && freshOrder.stockReleased,
      );

      let nextSlugs: string[] = [];
      let orderJson: OrderPayload | null = null;
      if (shouldRelease && freshOrder) {
        nextSlugs = await applyStockRelease(
          tx,
          aggregateStockLines(freshOrder.items),
        );
        orderJson = { ...freshOrder, stockReleased: true };
      } else if (shouldCommit && freshOrder) {
        nextSlugs = await applyStockCommit(
          tx,
          aggregateStockLines(freshOrder.items),
        );
        orderJson = { ...freshOrder, stockReleased: false };
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          adminNote,
          receiptSentAt,
          ...(orderJson
            ? { orderJson: orderJson as unknown as Prisma.InputJsonValue }
            : {}),
        },
      });
      return { row: updated, slugs: nextSlugs };
    });
  })();

  if (!row) return null;
  revalidateStockedProducts(slugs);

  const stored = rowToStored(row);
  if (stored && status === "delivered") {
    // Await so serverless (Vercel) does not kill generation mid-flight.
    await maybeGenerateVeloraCard(stored);
    try {
      const { awardForDeliveredOrder } = await import("@/lib/loyalty/award");
      await awardForDeliveredOrder(stored);
    } catch (err) {
      console.error("[loyalty] deliver award failed:", err);
    }
  }
  if (
    stored &&
    (status === "returned" ||
      status === "cancelled" ||
      status === "failed_delivery")
  ) {
    try {
      const { reverseForOrder } = await import("@/lib/loyalty/award");
      await reverseForOrder(stored);
    } catch (err) {
      console.error("[loyalty] order reversal failed:", err);
    }
  }
  return stored;
}

export function countOrdersByStatus(orders: StoredOrder[]) {
  const base = {
    all: orders.length,
    new: 0,
    confirmed: 0,
    preparing: 0,
    ready_to_ship: 0,
    handed_to_courier: 0,
    in_transit: 0,
    out_for_delivery: 0,
    delivered: 0,
    deferred: 0,
    cancelled: 0,
    returned: 0,
    failed_delivery: 0,
  } satisfies Record<"all" | OrderStatus, number>;

  for (const o of orders) {
    base[o.status] += 1;
  }
  return base;
}

export function filterOrders(
  orders: StoredOrder[],
  opts: { status?: OrderStatus | "all"; q?: string },
) {
  const q = opts.q?.trim().toLowerCase() || "";
  return orders.filter((entry) => {
    if (opts.status && opts.status !== "all" && entry.status !== opts.status) {
      return false;
    }
    if (!q) return true;
    const hay = [
      entry.orderId,
      entry.order.fullName,
      entry.order.phone,
      entry.order.email,
      entry.order.city,
      entry.order.address,
      entry.order.paymentMethodLabel,
      entry.order.source || "",
      entry.order.createdByAdminName || "",
      entry.adminNote || "",
      ...entry.order.items.map((i) => `${i.nameAr} ${i.name}`),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export async function markOrderPaidByWayl(
  orderId: string,
  meta: { waylLinkId?: string; waylEventId?: string },
): Promise<StoredOrder | null> {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return null;

  const stored = rowToStored(existing);
  if (!stored) return null;

  if (
    meta.waylEventId &&
    existing.adminNote?.includes(`wayl-event:${meta.waylEventId}`)
  ) {
    return stored;
  }

  if (stored.order.paymentStatus === "paid") {
    return stored;
  }

  const order: OrderPayload = {
    ...stored.order,
    paymentStatus: "paid",
    waylLinkId: meta.waylLinkId || stored.order.waylLinkId,
  };

  const noteParts = [
    existing.adminNote?.trim(),
    meta.waylEventId ? `wayl-event:${meta.waylEventId}` : null,
    meta.waylLinkId ? `wayl-link:${meta.waylLinkId}` : null,
    "دفع Wayl ✓",
  ].filter(Boolean);

  const row = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderJson: order as unknown as Prisma.InputJsonValue,
      adminNote: noteParts.join(" · "),
    },
  });

  return rowToStored(row);
}
