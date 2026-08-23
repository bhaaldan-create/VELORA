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
      subtitle="إدارة الكتالوج، الأسعار، المخزون، والإظهار."
    >
      <ProductsAdmin initialProducts={products} initialStats={stats} />
    </AdminShell>
  );
}
