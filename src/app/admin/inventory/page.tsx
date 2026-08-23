import { AdminShell } from "@/components/admin/AdminShell";
import {
  EmptyState,
  PageHeader,
  StatCard,
  Surface,
} from "@/components/admin/ui/primitives";
import { Package, Warehouse } from "@/components/admin/ui/icons";
import { listAdminProducts } from "@/lib/admin-products";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const products = await listAdminProducts();
  const active = products.filter((p) => p.isActive);
  const low = active.filter((p) => p.stock > 0 && p.stock <= 10);
  const out = active.filter((p) => p.stock <= 0);
  const stockValue = active.reduce((s, p) => s + p.stock * p.price, 0);

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
            label="قيمة المخزون"
            value={stockValue}
            format="iqd"
            icon={Warehouse}
          />
          <StatCard label="منتجات نشطة" value={active.length} format="number" />
          <StatCard
            label="مخزون منخفض"
            value={low.length}
            format="number"
            tone="warning"
          />
          <StatCard
            label="نفد المخزون"
            value={out.length}
            format="number"
            tone="danger"
          />
        </div>

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
              <p className="py-8 text-center text-[13px] text-[var(--admin-text-muted)]">
                لا منتجات نافدة حالياً.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--admin-border)]">
                {out.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-[13px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.nameAr}</p>
                      <p className="admin-num text-[11px] text-[var(--admin-text-muted)]">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-[var(--admin-danger)]">
                      نفد
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </div>
      </div>
    </AdminShell>
  );
}
