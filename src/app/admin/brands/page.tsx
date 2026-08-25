import { AdminShell } from "@/components/admin/AdminShell";
import { BrandsAdmin } from "@/components/admin/BrandsAdmin";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { listProductProfitability } from "@/lib/finance/overview";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const rows = await listProductProfitability();
  const byBrand = new Map<
    string,
    { products: number; withCost: number; avgMargin: number; stockValue: number }
  >();

  for (const r of rows) {
    const key = r.brandName || "—";
    const cur = byBrand.get(key) || {
      products: 0,
      withCost: 0,
      avgMargin: 0,
      stockValue: 0,
    };
    cur.products += 1;
    if (r.cost.hasCostData && r.cost.grossMarginPct !== null) {
      cur.withCost += 1;
      cur.avgMargin += r.cost.grossMarginPct;
      cur.stockValue += r.cost.landedCostIqd * Math.max(0, r.stock);
    }
    byBrand.set(key, cur);
  }

  const brandStats = [...byBrand.entries()]
    .map(([name, v]) => ({
      name,
      products: v.products,
      avgMargin:
        v.withCost > 0 ? Math.round((v.avgMargin / v.withCost) * 10) / 10 : null,
      stockValue: Math.round(v.stockValue),
      withCost: v.withCost,
    }))
    .sort((a, b) => (b.avgMargin ?? -999) - (a.avgMargin ?? -999));

  return (
    <AdminShell active="brands" title="العلامات">
      <div className="space-y-5">
        <PageHeader
          title="ذكاء العلامات"
          description="مصدر العلامة، المورد، والهامش المتوسط من تكلفة المنتجات — بدون اختراع أرقام."
        />
        <Surface className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-start text-[12px]">
            <thead className="border-b border-[var(--admin-border)] text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">العلامة</th>
                <th className="px-3 py-2 font-medium">منتجات</th>
                <th className="px-3 py-2 font-medium">متوسط الهامش</th>
                <th className="px-3 py-2 font-medium">قيمة مخزون (تكلفة)</th>
              </tr>
            </thead>
            <tbody>
              {brandStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-[var(--admin-text-muted)]">
                    لا منتجات بعد
                  </td>
                </tr>
              ) : (
                brandStats.map((b) => (
                  <tr key={b.name} className="border-b border-[var(--admin-border)]/50">
                    <td className="px-3 py-2 font-medium">{b.name}</td>
                    <td className="px-3 py-2 admin-num">{b.products}</td>
                    <td className="px-3 py-2 admin-num">
                      {b.avgMargin === null ? "غير كافٍ" : `${b.avgMargin}%`}
                    </td>
                    <td className="px-3 py-2 admin-num" dir="ltr">
                      {b.withCost === 0 ? "—" : formatPrice(b.stockValue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Surface>
        <BrandsAdmin />
      </div>
    </AdminShell>
  );
}
