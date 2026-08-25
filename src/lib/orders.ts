import { prisma } from "@/lib/db";
import type { OrderPayload } from "@/lib/order-email";
import {
  normalizeStatus,
  ORDER_STATUSES,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/order-types";
import type { Prisma } from "@/generated/prisma/client";

export type { OrderStatus, StoredOrder } from "@/lib/order-types";
export { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-types";

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

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  opts?: { adminNote?: string; markReceiptSent?: boolean },
): Promise<StoredOrder | null> {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return null;

  const row = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      adminNote:
        typeof opts?.adminNote === "string"
          ? opts.adminNote.trim() || null
          : existing.adminNote,
      receiptSentAt: opts?.markReceiptSent
        ? new Date()
        : existing.receiptSentAt,
    },
  });

  return rowToStored(row);
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
