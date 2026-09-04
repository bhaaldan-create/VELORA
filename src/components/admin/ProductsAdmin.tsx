"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { ProductCreateForm } from "@/components/admin/ProductCreateForm";
import { formatPrice } from "@/lib/utils";
import type { AdminProduct, AdminProductStats } from "@/lib/admin-product-types";
import { ADMIN_CATEGORY_LABELS } from "@/lib/admin-product-types";
import { shopBrands } from "@/data/shop-brands";

type Visibility = "all" | "active" | "hidden" | "low" | "out" | "sale";

const PRODUCT_SECTIONS = [
  { id: "all", label: "كل المنتجات", slug: null },
  { id: "skincare", label: "العناية بالبشرة", slug: "skincare" },
  { id: "makeup", label: "المكياج", slug: "makeup" },
  { id: "hair-care", label: "العناية بالشعر", slug: "hair-care" },
  { id: "body-care", label: "العناية بالجسم", slug: "body-care" },
] as const;

type SectionId = (typeof PRODUCT_SECTIONS)[number]["id"];

const PAGE_SIZE = 24;

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
  initialProducts?: AdminProduct[];
  initialStats?: AdminProductStats;
};

type ListResponse = {
  ok?: boolean;
  products?: AdminProduct[];
  total?: number;
  page?: number;
  pageSize?: number;
  stats?: AdminProductStats;
  categoryCounts?: Record<string, number>;
  error?: string;
};

const emptyStats: AdminProductStats = {
  all: 0,
  active: 0,
  hidden: 0,
  lowStock: 0,
  outOfStock: 0,
  onSale: 0,
};

export function ProductsAdmin({ initialProducts = [], initialStats }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [stats, setStats] = useState<AdminProductStats>(
    initialStats ?? emptyStats,
  );
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    all: initialStats?.all ?? 0,
    skincare: 0,
    makeup: 0,
    "hair-care": 0,
    "body-care": 0,
  });
  const [total, setTotal] = useState(initialProducts.length);
  const [page, setPage] = useState(1);
  const [section, setSection] = useState<SectionId>(() =>
    parseSection(searchParams.get("category")),
  );
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [brand, setBrand] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      params.set("visibility", visibility);
      if (section !== "all") params.set("category", section);
      if (brand) params.set("brand", brand);
      if (debouncedQ) params.set("q", debouncedQ);

      const res = await fetch(`/api/admin/products?${params}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ListResponse;
      if (id !== requestId.current) return;
      if (!res.ok || !json.ok || !json.products) {
        throw new Error(json.error || "تعذّر تحميل المنتجات.");
      }
      setProducts(json.products);
      setTotal(json.total ?? json.products.length);
      if (json.stats) setStats(json.stats);
      if (json.categoryCounts) setCategoryCounts(json.categoryCounts);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : "تعذّر تحميل المنتجات.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [page, visibility, section, brand, debouncedQ]);

  useEffect(() => {
    // Debounced remote fetch — setState happens after network, not as a sync cascade.
    const handle = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  function selectSection(next: SectionId) {
    setSection(next);
    setVisibility("all");
    setQuery("");
    setDebouncedQ("");
    setPage(1);
    const url =
      next === "all" ? "/admin/products" : `/admin/products?category=${next}`;
    router.replace(url, { scroll: false });
  }

  function prependProduct(created: AdminProduct) {
    startTransition(() => {
      setShowCreate(false);
      setVisibility("all");
      setQuery("");
      setDebouncedQ("");
      setBrand(created.brandName || "");
      setPage(1);
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
    { id: "all", label: "الكل", count: stats.all },
    { id: "active", label: "ظاهر", count: stats.active },
    { id: "hidden", label: "مخفي", count: stats.hidden },
    { id: "sale", label: "خصم", count: stats.onSale },
    { id: "low", label: "مخزون منخفض", count: stats.lowStock },
    { id: "out", label: "نفد", count: stats.outOfStock },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
              : `منتجات قسم ${activeSection.label} — ${total} نتيجة.`}
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
                {categoryCounts[s.id] ?? 0} منتج
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
            onClick={() => {
              setVisibility(f.id);
              setPage(1);
            }}
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

      <div className="grid gap-2 sm:grid-cols-[1fr_minmax(0,220px)]">
        <input
          id="product-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder={
            section === "all"
              ? "الاسم، البراند، المعرّف…"
              : `ابحثي داخل ${activeSection.label}…`
          }
          className="h-11 w-full rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 text-[14px] outline-none focus:border-[var(--admin-plum-soft)]"
        />
        <select
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            setPage(1);
          }}
          className="h-11 w-full rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-[13px] outline-none focus:border-[var(--admin-plum-soft)]"
          dir="ltr"
        >
          <option value="">كل البراندات</option>
          {shopBrands.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
          <button
            type="button"
            onClick={() => void load()}
            className="ms-3 font-medium underline"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {loading && products.length === 0 ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-[14px] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)]"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
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
        <>
          <ul className={`space-y-2.5 ${loading ? "opacity-60" : ""}`}>
            {products.map((p) => {
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
                          loading="lazy"
                          onError={(e) => {
                            const el = e.currentTarget;
                            el.style.display = "none";
                            const fallback =
                              el.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`flex h-full items-center justify-center px-1 text-center text-[10px] text-[var(--admin-text-muted)] ${
                          p.imageUrl ? "hidden" : ""
                        }`}
                      >
                        {p.imageUrl ? "صورة غير متاحة" : "بدون صورة"}
                      </div>
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
                        {p.brandName ? (
                          <span
                            className="rounded-full bg-[var(--admin-surface-soft)] px-2 py-0.5 text-[11px] text-[var(--admin-text-secondary)]"
                            dir="ltr"
                          >
                            {p.brandName}
                          </span>
                        ) : null}
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

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 rounded-[8px] border border-[var(--admin-border)] bg-white px-3 text-[13px] disabled:opacity-40"
              >
                السابق
              </button>
              <span className="text-[13px] text-[var(--admin-text-secondary)]">
                صفحة {page} من {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 rounded-[8px] border border-[var(--admin-border)] bg-white px-3 text-[13px] disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
