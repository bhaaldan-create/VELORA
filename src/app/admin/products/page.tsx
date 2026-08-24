import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductsAdmin } from "@/components/admin/ProductsAdmin";
import {
  countAdminProductStats,
  listAdminProducts,
} from "@/lib/admin-products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAdminProducts();
  const stats = countAdminProductStats(products);

  return (
    <AdminShell
      active="products"
      title="المنتجات"
      subtitle="إدارة الكتالوج حسب القسم: العناية، المكياج، الشعر، والجسم."
    >
      <Suspense
        fallback={
          <p className="text-sm text-[var(--admin-text-secondary)]">
            جارٍ التحميل…
          </p>
        }
      >
        <ProductsAdmin initialProducts={products} initialStats={stats} />
      </Suspense>
    </AdminShell>
  );
}
