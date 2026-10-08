import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/ProductDetail";
import {
  getProductBySlug,
  getRelatedProducts,
  getRoutineCompanions,
} from "@/lib/catalog";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";

/** ISR — payloads use /api/media paths (no embedded image blobs). */
export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "منتج" };
  return {
    title: product.nameAr,
    description: product.descriptionAr,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, routine] = await Promise.all([
    getRelatedProducts(product, 8),
    getRoutineCompanions(product, 2),
  ]);

  return (
    <ProductDetail product={product} related={related} routine={routine} />
  );
}
