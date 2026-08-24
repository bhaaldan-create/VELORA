"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

/** أقسام الكتالوج المعروضة منفصلة للتعديل */
const PRODUCT_SECTIONS = [
  { id: "all", label: "كل المنتجات", slug: null },
  { id: "skincare", label: "العناية بالبشرة", slug: "skincare" },
  { id: "makeup", label: "المكياج", slug: "makeup" },
  { id: "hair-care", label: "العناية بالشعر", slug: "hair-care" },
  { id: "body-care", label: "العناية بالجسم", slug: "body-care" },
] as const;

type SectionId = (typeof PRODUCT_SECTIONS)[number]["id"];

function parseSection(raw: string | null): SectionId {
  if (
    raw === "skincare" ||
    raw === "makeup" ||
    raw === "hair-care" ||
    raw === "body-care"
  ) {
    return raw;
  }
  return "all";
}

type Props = {
  initialProducts: AdminProduct[];
  initialStats?: Stats;
};

export function ProductsAdmin({ initialProducts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [section, setSection] = useState<SectionId>(() =>
    parseSection(searchParams.get("category")),
  );
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [showCreate, setShowCreate] = useState(false);
  const [, startTransition] = useTransition();

  const sectionProducts = useMemo(() => {
    if (section === "all") return products;
    return products.filter((p) => p.categorySlug === section);
  }, [products, section]);

  const sectionStats = useMemo(() => {
    const list = sectionProducts;
    return {
      all: list.length,
      active: list.filter((p) => p.isActive).length,
      hidden: list.filter((p) => !p.isActive).length,
      lowStock: list.filter((p) => p.stock > 0 && p.stock <= 10).length,
      outOfStock: list.filter((p) => p.stock <= 0).length,
      onSale: list.filter((p) => p.discountPercent > 0).length,
    };
  }, [sectionProducts]);

  const sectionCounts = useMemo(() => {
    const counts: Record<SectionId, number> = {
      all: products.length,
      skincare: 0,
      makeup: 0,
      "hair-care": 0,
      "body-care": 0,
    };
    for (const p of products) {
      if (p.categorySlug in counts) {
        counts[p.categorySlug as SectionId] += 1;
      }
    }
    return counts;
  }, [products]);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return sectionProducts.filter((p) => {
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
  }, [sectionProducts, visibility, deferredQuery]);

  function selectSection(next: SectionId) {
    setSection(next);
    setVisibility("all");
    setQuery("");
    const url =
      next === "all" ? "/admin/products" : `/admin/products?category=${next}`;
    router.replace(url, { scroll: false });
  }

  function prependProduct(created: AdminProduct) {
    startTransition(() => {
      setProducts((prev) => [created, ...prev]);
      setShowCreate(false);
      setVisibility("all");
      setQuery("");
      if (
        created.categorySlug === "skincare" ||
        created.categorySlug === "makeup" ||
        created.categorySlug === "hair-care" ||
        created.categorySlug === "body-care"
      ) {
        setSection(created.categorySlug);
      }
    });
    router.push(`/admin/products/${created.id}`);
  }

  const activeSection =
    PRODUCT_SECTIONS.find((s) => s.id === section) ?? PRODUCT_SECTIONS[0];

  const filters: { id: Visibility; label: string; count: number }[] = [
    { id: "all", label: "الكل", count: sectionStats.all },
    { id: "active", label: "ظاهر", count: sectionStats.active },
    { id: "hidden", label: "مخفي", count: sectionStats.hidden },
    { id: "sale", label: "خصم", count: sectionStats.onSale },
    { id: "low", label: "مخزون منخفض", count: sectionStats.lowStock },
    { id: "out", label: "نفد", count: sectionStats.outOfStock },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight text-[var(--admin-text)]">
            {section === "all" ? "المنتجات" : activeSection.label}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--admin-text-secondary)]">
            {section === "all"
              ? "اختاري قسماً أدناه للتعديل براحة، أو اعرضي الكل."
              : `منتجات قسم ${activeSection.label} فقط — ${sectionStats.all} منتج.`}
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {PRODUCT_SECTIONS.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSection(s.id)}
              className={`rounded-[12px] border px-3 py-3 text-start transition ${
                active
                  ? "border-[var(--admin-plum)] bg-[var(--admin-plum)] text-white shadow-[var(--admin-shadow)]"
                  : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:border-[var(--admin-plum-soft)]"
              }`}
            >
              <span className="block text-[13px] font-semibold leading-snug">
                {s.label}
              </span>
              <span
                className={`admin-num mt-1 block text-[12px] ${
                  active ? "text-white/80" : "text-[var(--admin-text-muted)]"
                }`}
              >
                {sectionCounts[s.id]} منتج
              </span>
            </button>
          );
        })}
      </div>

      {showCreate ? (
        <ProductCreateForm
          onCreated={prependProduct}
          onCancel={() => setShowCreate(false)}
          defaultCategorySlug={
            section === "all" ? undefined : activeSection.slug ?? undefined
          }
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
        placeholder={
          section === "all"
            ? "الاسم، التصنيف، المعرّف…"
            : `ابحثي داخل ${activeSection.label}…`
        }
        className="h-11 w-full rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 text-[14px] outline-none focus:border-[var(--admin-plum-soft)]"
      />

      {visible.length === 0 ? (
        <div className="rounded-[var(--admin-radius)] border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-bg-elevated)] px-6 py-14 text-center">
          <p className="text-[15px] font-medium text-[var(--admin-text)]">
            لا توجد منتجات مطابقة
          </p>
          {section !== "all" ? (
            <button
              type="button"
              onClick={() => selectSection("all")}
              className="mt-3 text-[13px] font-medium text-[var(--admin-plum)]"
            >
              عرض كل المنتجات
            </button>
          ) : null}
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
                      {section === "all" ? (
                        <span className="text-[11px] text-[var(--admin-text-muted)]">
                          {categoryLabel}
                        </span>
                      ) : null}
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
