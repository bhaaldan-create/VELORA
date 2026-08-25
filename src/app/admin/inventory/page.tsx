import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  EmptyState,
  PageHeader,
  StatCard,
  Surface,
} from "@/components/admin/ui/primitives";
import { Package, Warehouse } from "@/components/admin/ui/icons";
import { analyzeProductCost, salePriceIqd } from "@/lib/finance/product-cost";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
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
        minMarginPct: true,
      },
      orderBy: { nameAr: "asc" },
    }),
    prisma.inventoryMovement.findMany({
      include: { product: { select: { nameAr: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const low = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const out = products.filter((p) => p.stock <= 0);

  let retailValue = 0;
  let costValue = 0;
  let costGaps = 0;
  for (const p of products) {
    retailValue +=
      salePriceIqd(p.price, p.discountPercent) * Math.max(0, p.stock);
    const a = analyzeProductCost(p);
    if (a.hasCostData) costValue += a.landedCostIqd * Math.max(0, p.stock);
    else if (p.stock > 0) costGaps += 1;
  }
  const inventoryCostValue = costGaps === 0 ? Math.round(costValue) : null;

  return (
    <AdminShell active="inventory" title="المخزون">
      <div className="space-y-6">
        <PageHeader
          title="المخزون"
          description="متابعة المخزون المنخفض ونفاد الكمية وقيمة المخزون."
          actions={
            <Link
              href="/admin/products"
              className="inline-flex h-8 items-center rounded-[8px] border border-[var(--admin-border)] px-3 text-[12px] text-[var(--admin-text-secondary)]"
            >
              إدارة المنتجات
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="قيمة المخزون للبيع"
            value={Math.round(retailValue)}
            format="iqd"
            icon={Warehouse}
          />
          <StatCard
            label="قيمة المخزون بالتكلفة"
            value={inventoryCostValue ?? 0}
            format="iqd"
            tone={inventoryCostValue == null ? "warning" : "info"}
          />
          <StatCard label="منتجات نشطة" value={products.length} format="number" />
          <StatCard
            label="مخزون منخفض"
            value={low.length}
            format="number"
            tone="warning"
          />
        </div>

        {inventoryCostValue == null ? (
          <p className="rounded-[12px] bg-[var(--admin-warning-bg)] px-4 py-3 text-[13px] text-[var(--admin-warning)]">
            قيمة التكلفة غير مكتملة لأن بعض المنتجات المتوفرة بلا تكلفة واصلة.
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Surface>
            <h2 className="mb-3 text-[13px] font-semibold">مخزون منخفض</h2>
            {low.length === 0 ? (
              <EmptyState
                icon={Package}
                title="لا يوجد مخزون منخفض"
                description="كل المنتجات فوق حد التنبيه (10 وحدات)."
              />
            ) : (
              <ul className="divide-y divide-[var(--admin-border)]">
                {low.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-[13px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.nameAr}</p>
                      <p className="text-[11px] text-[var(--admin-text-muted)]">
                        {p.name}
                      </p>
                    </div>
                    <span className="admin-num font-semibold text-[var(--admin-warning)]">
                      {p.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Surface>

          <Surface>
            <h2 className="mb-3 text-[13px] font-semibold">نفد المخزون</h2>
            {out.length === 0 ? (
              <EmptyState
                icon={Package}
                title="لا منتجات نافدة"
                description="كل المنتجات المتفعّلة لديها رصيد."
              />
            ) : (
              <ul className="divide-y divide-[var(--admin-border)]">
                {out.slice(0, 12).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-[13px]"
                  >
                    <p className="truncate font-medium">{p.nameAr}</p>
                    <span className="admin-num text-[var(--admin-danger)]">0</span>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </div>

        <Surface className="overflow-hidden">
          <div className="border-b border-[var(--admin-border)] p-4">
            <h2 className="text-[13px] font-semibold">أحدث حركات المخزون</h2>
          </div>
          {movements.length === 0 ? (
            <p className="p-4 text-[13px] text-[var(--admin-text-muted)]">
              لا حركات بعد — استلام شحنة استيراد سيظهر هنا.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--admin-border)]">
              {movements.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.product.nameAr}</p>
                    <p className="text-[11px] text-[var(--admin-text-muted)]">
                      {m.type}
                      {m.reference ? ` · ${m.reference}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="admin-num font-semibold" dir="ltr">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </p>
                    <p className="admin-num text-[11px] text-[var(--admin-text-muted)]">
                      رصيد {m.balanceAfter}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-[var(--admin-border)] px-4 py-2 text-[11px] text-[var(--admin-text-muted)]">
            قيمة التجزئة الحالية: {formatPrice(Math.round(retailValue))} · سرعة
            البيع وأيام النفاد: بيانات غير كافية قبل وجود مبيعات كافية.
          </p>
        </Surface>
      </div>
    </AdminShell>
  );
}
