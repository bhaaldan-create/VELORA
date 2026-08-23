import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { getAdminProductById } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ productId: string }>;
};

export default async function AdminProductEditPage({ params }: Props) {
  const { productId } = await params;
  const product = await getAdminProductById(productId);
  if (!product) notFound();

  return (
    <AdminShell active="products">
      <ProductEditor initialProduct={product} />
    </AdminShell>
  );
}
