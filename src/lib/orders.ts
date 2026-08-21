import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  normalizeStatus,
  ORDER_STATUSES,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/order-types";

export type { OrderStatus, StoredOrder } from "@/lib/order-types";
export { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-types";

const ORDERS_DIR = path.join(process.cwd(), "data", "orders");

function normalizeOrder(
  raw: Partial<StoredOrder> & { orderId?: string },
): StoredOrder | null {
  if (!raw.orderId || !raw.order || !raw.savedAt) return null;
  return {
    savedAt: raw.savedAt,
    updatedAt: raw.updatedAt,
    orderId: raw.orderId,
    subject: raw.subject || `طلب #${raw.orderId}`,
    emailedTo: raw.emailedTo,
    status: normalizeStatus(raw.status),
    order: raw.order,
    text: raw.text || "",
    adminNote: raw.adminNote,
    receiptSentAt: raw.receiptSentAt,
  };
}

async function ensureDir() {
  await mkdir(ORDERS_DIR, { recursive: true });
}

function orderPath(orderId: string) {
  return path.join(ORDERS_DIR, `${orderId}.json`);
}

export async function saveStoredOrder(
  input: Omit<StoredOrder, "status" | "updatedAt"> & {
    status?: OrderStatus;
  },
): Promise<StoredOrder> {
  await ensureDir();
  const stored: StoredOrder = {
    ...input,
    status: input.status ?? "new",
    updatedAt: new Date().toISOString(),
  };
  await writeFile(orderPath(stored.orderId), JSON.stringify(stored, null, 2), "utf8");
  return stored;
}

export async function getStoredOrder(
  orderId: string,
): Promise<StoredOrder | null> {
  try {
    const raw = await readFile(orderPath(orderId), "utf8");
    return normalizeOrder(JSON.parse(raw) as Partial<StoredOrder>);
  } catch {
    return null;
  }
}

export async function listStoredOrders(): Promise<StoredOrder[]> {
  await ensureDir();
  const files = (await readdir(ORDERS_DIR))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  const orders: StoredOrder[] = [];
  for (const file of files) {
    try {
      const raw = await readFile(path.join(ORDERS_DIR, file), "utf8");
      const normalized = normalizeOrder(JSON.parse(raw) as Partial<StoredOrder>);
      if (normalized) orders.push(normalized);
    } catch {
      // ignore corrupt files
    }
  }

  return orders.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  opts?: { adminNote?: string; markReceiptSent?: boolean },
): Promise<StoredOrder | null> {
  const existing = await getStoredOrder(orderId);
  if (!existing) return null;

  const updated: StoredOrder = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
    adminNote:
      typeof opts?.adminNote === "string"
        ? opts.adminNote.trim() || undefined
        : existing.adminNote,
    receiptSentAt: opts?.markReceiptSent
      ? new Date().toISOString()
      : existing.receiptSentAt,
  };

  await writeFile(orderPath(orderId), JSON.stringify(updated, null, 2), "utf8");
  return updated;
}

export function countOrdersByStatus(orders: StoredOrder[]) {
  return {
    all: orders.length,
    new: orders.filter((o) => o.status === "new").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };
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
