import { FeaturedProductsView } from "@/components/home/FeaturedProductsView";
import { ProductCard } from "@/components/shop/ProductCard";
import { getFeaturedProducts } from "@/lib/catalog";

export async function FeaturedProducts() {
  const featured = await getFeaturedProducts(6);

  return (
    <FeaturedProductsView>
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </FeaturedProductsView>
  );
}
