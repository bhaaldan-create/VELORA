import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductsAdmin } from "@/components/admin/ProductsAdmin";
import { listAdminProductsPage } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // First page only — never load full catalog / image blobs into RSC props
  const first = await listAdminProductsPage({ page: 1, pageSize: 24 });

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
        <ProductsAdmin
          initialProducts={first.products}
          initialStats={first.stats}
        />
      </Suspense>
    </AdminShell>
  );
}
