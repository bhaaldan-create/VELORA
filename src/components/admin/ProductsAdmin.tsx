"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { ProductCreateForm } from "@/components/admin/ProductCreateForm";
import { formatPrice } from "@/lib/utils";
import type { AdminProduct } from "@/lib/admin-product-types";
import { ADMIN_CATEGORY_LABELS } from "@/lib/admin-product-types";

type Stats = {
  all: number;
  active: number;
  hidden: number;
  lowStock: number;
  outOfStock: number;
  onSale: number;
};

type Visibility = "all" | "active" | "hidden" | "low" | "out" | "sale";

type Props = {
  initialProducts: AdminProduct[];
  initialStats: Stats;
};

export function ProductsAdmin({ initialProducts, initialStats }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [stats, setStats] = useState(initialStats);
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [showCreate, setShowCreate] = useState(false);
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (visibility === "active" && !p.isActive) return false;
      if (visibility === "hidden" && p.isActive) return false;
      if (visibility === "low" && !(p.stock > 0 && p.stock <= 10)) return false;
      if (visibility === "out" && p.stock > 0) return false;
      if (visibility === "sale" && p.discountPercent <= 0) return false;
      if (!q) return true;
      const hay =
        `${p.id} ${p.slug} ${p.name} ${p.nameAr} ${p.categorySlug}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, visibility, deferredQuery]);

  function refreshStats(next: AdminProduct[]) {
    setStats({
      all: next.length,
      active: next.filter((p) => p.isActive).length,
      hidden: next.filter((p) => !p.isActive).length,
      lowStock: next.filter((p) => p.stock > 0 && p.stock <= 10).length,
      outOfStock: next.filter((p) => p.stock <= 0).length,
      onSale: next.filter((p) => p.discountPercent > 0).length,
    });
  }

  function prependProduct(created: AdminProduct) {
    startTransition(() => {
      setProducts((prev) => {
        const next = [created, ...prev];
        refreshStats(next);
        return next;
      });
      setShowCreate(false);
      setVisibility("all");
      setQuery("");
    });
    router.push(`/admin/products/${created.id}`);
  }

  const filters: { id: Visibility; label: string; count: number }[] = [
    { id: "all", label: "الكل", count: stats.all },
    { id: "active", label: "ظاهر", count: stats.active },
    { id: "hidden", label: "مخفي", count: stats.hidden },
    { id: "sale", label: "خصم", count: stats.onSale },
    { id: "low", label: "مخزون منخفض", count: stats.lowStock },
    { id: "out", label: "نفد", count: stats.outOfStock },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight text-[var(--admin-text)]">
            المنتجات
          </h1>
          <p className="mt-1 text-[13px] text-[var(--admin-text-secondary)]">
            أضيفي منتجات جديدة أو افتحي محرّر المنتج للتعديل.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex h-9 items-center rounded-[8px] bg-[var(--admin-plum)] px-3.5 text-[13px] font-medium text-white"
        >
          {showCreate ? "إغلاق النموذج" : "إضافة منتج"}
        </button>
      </div>

      {showCreate ? (
        <ProductCreateForm
          onCreated={prependProduct}
          onCancel={() => setShowCreate(false)}
        />
      ) : null}

      <div className="flex gap-2 overflow-x-auto admin-scroll pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setVisibility(f.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
              visibility === f.id
                ? "bg-[var(--admin-plum)] text-white"
                : "border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)]"
            }`}
          >
            {f.label}
            <span className="admin-num ms-1.5 opacity-70">{f.count}</span>
          </button>
        ))}
      </div>

      <input
        id="product-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="الاسم، التصنيف، المعرّف…"
        className="h-11 w-full rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 text-[14px] outline-none focus:border-[var(--admin-plum-soft)]"
      />

      {visible.length === 0 ? (
        <div className="rounded-[var(--admin-radius)] border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-bg-elevated)] px-6 py-14 text-center">
          <p className="text-[15px] font-medium text-[var(--admin-text)]">
            لا توجد منتجات مطابقة
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((p) => {
            const categoryLabel =
              ADMIN_CATEGORY_LABELS[p.categorySlug] || p.categorySlug;
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="flex gap-4 rounded-[14px] border border-[var(--admin-border)] bg-white p-4 shadow-[var(--admin-shadow)] transition hover:border-[var(--admin-plum-soft)] sm:p-5"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-[10px] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] sm:h-24 sm:w-20">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.nameAr}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-[var(--admin-text-muted)]">
                        بدون صورة
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          p.isActive
                            ? "bg-[var(--admin-success-bg)] text-[var(--admin-success)]"
                            : "bg-[var(--admin-surface-mute)] text-[var(--admin-text-muted)]"
                        }`}
                      >
                        {p.isActive ? "ظاهر" : "مخفي"}
                      </span>
                      {p.discountPercent > 0 ? (
                        <span className="rounded-full bg-[var(--admin-plum)]/8 px-2 py-0.5 text-[11px] font-medium text-[var(--admin-plum)]">
                          خصم {p.discountPercent}%
                        </span>
                      ) : null}
                      <span className="text-[11px] text-[var(--admin-text-muted)]">
                        {categoryLabel}
                      </span>
                    </div>
                    <h2 className="mt-1.5 truncate text-[15px] font-semibold text-[var(--admin-text)]">
                      {p.nameAr}
                    </h2>
                    <p
                      className="truncate text-[12.5px] text-[var(--admin-text-secondary)]"
                      dir="ltr"
                    >
                      {p.name} · {p.size}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px]">
                      <span className="font-medium text-[var(--admin-plum)]">
                        {formatPrice(p.salePrice)}
                      </span>
                      <span className="text-[var(--admin-text-muted)]">
                        مخزون {p.stock}
                      </span>
                    </div>
                  </div>

                  <span className="hidden self-center text-[12.5px] font-medium text-[var(--admin-plum)] sm:inline">
                    تعديل
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
