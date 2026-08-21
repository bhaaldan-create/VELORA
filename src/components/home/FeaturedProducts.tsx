import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/Button";
import { getFeaturedProducts } from "@/lib/catalog";
import { ui } from "@/constants/brand";

export async function FeaturedProducts() {
  const featured = await getFeaturedProducts(6);

  return (
    <section className="bg-[var(--mist)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
              {ui.theEdit}
            </p>
            <h2 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
              الأكثر مبيعاً والوصولات الجديدة
            </h2>
          </div>
          <Link href="/shop">
            <Button variant="ghost">{ui.viewAll}</Button>
          </Link>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
