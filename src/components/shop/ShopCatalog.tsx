"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import { ui } from "@/constants/brand";
import type { Category, CategorySlug, Product } from "@/types";

interface ShopCatalogProps {
  initialCategory?: string;
  products: Product[];
  categories: Category[];
}

export function ShopCatalog({
  initialCategory,
  products,
  categories,
}: ShopCatalogProps) {
  const [category, setCategory] = useState<string | undefined>(
    initialCategory && categories.some((c) => c.slug === initialCategory)
      ? initialCategory
      : undefined,
  );
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.toLowerCase().trim();
    let result = products;

    if (category) {
      result = result.filter((p) => p.category === category);
    }

    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameAr.includes(q) ||
          p.category.includes(q) ||
          p.concerns.some((c) => c.includes(q)) ||
          p.benefitsAr.some((b) => b.includes(q)) ||
          p.benefits.some((b) => b.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [products, category, query]);

  return (
    <div>
      <div className="flex flex-col gap-6 border-b border-[var(--plum)]/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
            {ui.shop}
          </p>
          <h1 className="font-display t7 mt-2 font-semibold text-[var(--plum)]">
            المجموعة
          </h1>
        </div>
        <label className="block w-full max-w-sm">
          <span className="sr-only">بحث</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui.search}
            className="t3 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none placeholder:text-[var(--muted)] focus:border-[var(--plum)]"
          />
        </label>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <FilterChip
          active={!category}
          onClick={() => setCategory(undefined)}
          label={ui.all}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat.slug}
            active={category === cat.slug}
            onClick={() => setCategory(cat.slug as CategorySlug)}
            label={cat.nameAr}
          />
        ))}
      </div>

      <p className="t3 mt-6 text-[var(--muted)]">{ui.productsCount(list.length)}</p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {list.length === 0 ? (
        <p className="t4 py-20 text-center text-[var(--muted)]">
          لا توجد منتجات مطابقة. جرّبي بحثاً آخر أو{" "}
          <Link href="/advisor" className="underline underline-offset-4">
            {ui.askAdvisor}
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "t2 px-4 py-2 font-medium transition-colors duration-300",
        active
          ? "bg-[var(--plum)] text-[var(--ivory)]"
          : "bg-[var(--mist)] text-[var(--ink)]/70 hover:bg-[var(--champagne)]",
      )}
    >
      {label}
    </button>
  );
}
