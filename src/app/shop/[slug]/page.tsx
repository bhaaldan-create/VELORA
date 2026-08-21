import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { getProductBySlug, getProductSlugs } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const slugs = await getProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

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
  return <ProductDetail product={product} />;
}
