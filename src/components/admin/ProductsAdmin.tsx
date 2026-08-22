"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { ProductCreateForm } from "@/components/admin/ProductCreateForm";
import { formatPrice } from "@/lib/utils";
import type { AdminProduct } from "@/lib/admin-product-types";
import { DISCOUNT_OPTIONS, salePriceFromBase } from "@/lib/pricing";

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

type Draft = {
  name: string;
  nameAr: string;
  price: string;
  stock: string;
};

export function ProductsAdmin({ initialProducts, initialStats }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [stats, setStats] = useState(initialStats);
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
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

  function getDraft(p: AdminProduct): Draft {
    return (
      drafts[p.id] || {
        name: p.name,
        nameAr: p.nameAr,
        price: String(p.price),
        stock: String(p.stock),
      }
    );
  }

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const current =
        prev[id] ||
        (() => {
          const product = products.find((x) => x.id === id)!;
          return {
            name: product.name,
            nameAr: product.nameAr,
            price: String(product.price),
            stock: String(product.stock),
          };
        })();
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }

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

  function applyProduct(updated: AdminProduct) {
    startTransition(() => {
      setProducts((prev) => {
        const next = prev.map((p) => (p.id === updated.id ? updated : p));
        refreshStats(next);
        return next;
      });
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[updated.id];
        return copy;
      });
      setSavedId(updated.id);
    });
  }

  function prependProduct(created: AdminProduct) {
    startTransition(() => {
      setProducts((prev) => {
        const next = [created, ...prev];
        refreshStats(next);
        return next;
      });
      setSavedId(created.id);
      setShowCreate(false);
      setVisibility("all");
      setQuery("");
    });
  }

  async function patchProduct(
    id: string,
    data: Partial<{
      name: string;
      nameAr: string;
      price: number;
      stock: number;
      discountPercent: number;
      isActive: boolean;
      isBestseller: boolean;
      isNew: boolean;
    }>,
  ) {
    setPendingId(id);
    setError(null);
    setSavedId(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        product?: AdminProduct;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.product) {
        throw new Error(json.error || "تعذّر التحديث.");
      }
      applyProduct(json.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر التحديث.");
    } finally {
      setPendingId(null);
    }
  }

  async function saveDetails(p: AdminProduct) {
    const draft = getDraft(p);
    const price = Number(draft.price);
    const stock = Number(draft.stock);
    const name = draft.name.trim();
    const nameAr = draft.nameAr.trim();

    if (!name || !nameAr) {
      setError("اسم المنتج بالعربية والإنجليزية مطلوب.");
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) {
      setError("السعر الأساسي يجب أن يكون رقماً صحيحاً غير سالب.");
      return;
    }
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      setError("المخزون يجب أن يكون رقماً صحيحاً غير سالب.");
      return;
    }
    await patchProduct(p.id, { name, nameAr, price, stock });
  }

  async function uploadImage(p: AdminProduct, file: File | null) {
    if (!file) return;
    setPendingId(p.id);
    setError(null);
    setSavedId(null);
    try {
      const form = new FormData();
      form.set("id", p.id);
      form.set("file", file);
      const res = await fetch("/api/admin/products/image", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        product?: AdminProduct;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.product) {
        throw new Error(json.error || "تعذّر رفع الصورة.");
      }
      applyProduct(json.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر رفع الصورة.");
    } finally {
      setPendingId(null);
    }
  }

  async function removeImage(p: AdminProduct) {
    setPendingId(p.id);
    setError(null);
    setSavedId(null);
    try {
      const res = await fetch("/api/admin/products/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        product?: AdminProduct;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.product) {
        throw new Error(json.error || "تعذّر حذف الصورة.");
      }
      applyProduct(json.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حذف الصورة.");
    } finally {
      setPendingId(null);
    }
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="t3 text-[var(--muted)]">
          أضيفي منتجات جديدة بكامل بياناتها، أو عدّلي المنتجات الحالية.
        </p>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="t2 bg-[var(--plum)] px-4 py-2.5 text-[var(--ivory)]"
        >
          {showCreate ? "إغلاق نموذج الإضافة" : "＋ إضافة منتج جديد"}
        </button>
      </div>

      {showCreate ? (
        <ProductCreateForm
          onCreated={prependProduct}
          onCancel={() => setShowCreate(false)}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setVisibility(f.id)}
            className={`border px-4 py-4 text-right transition ${
              visibility === f.id
                ? "border-[var(--plum)] bg-[var(--plum)] text-[var(--ivory)]"
                : "border-[var(--plum)]/15 bg-white text-[var(--plum)] hover:border-[var(--plum)]/40"
            }`}
          >
            <div className="t2 opacity-80">{f.label}</div>
            <div className="font-display t6 mt-1 font-medium">{f.count}</div>
          </button>
        ))}
      </div>

      <div>
        <label className="t2 text-[var(--muted)]" htmlFor="product-search">
          بحث في المنتجات
        </label>
        <input
          id="product-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="الاسم، التصنيف، المعرّف…"
          className="t4 mt-2 w-full border border-[var(--plum)]/20 bg-white px-4 py-3 outline-none focus:border-[var(--plum)]"
        />
      </div>

      {error ? (
        <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="border border-[var(--plum)]/15 bg-[var(--mist)] px-6 py-16 text-center">
          <p className="t4 text-[var(--plum)]">لا توجد منتجات مطابقة</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((p) => {
            const draft = getDraft(p);
            const busy = pendingId === p.id;
            const previewSale = salePriceFromBase(
              Number(draft.price) || p.price,
              p.discountPercent,
            );
            const dirty =
              draft.name !== p.name ||
              draft.nameAr !== p.nameAr ||
              draft.price !== String(p.price) ||
              draft.stock !== String(p.stock);

            return (
              <li
                key={p.id}
                className="border border-[var(--plum)]/12 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-4">
                    <div className="h-24 w-20 overflow-hidden border border-[var(--plum)]/10 bg-[var(--mist)]">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.nameAr}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center t1 text-[var(--muted)]">
                          بدون صورة
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`t1 px-2 py-1 ${
                            p.isActive
                              ? "bg-[var(--plum)] text-[var(--ivory)]"
                              : "bg-[var(--mist)] text-[var(--muted)]"
                          }`}
                        >
                          {p.isActive ? "ظاهر في المتجر" : "مخفي"}
                        </span>
                        {p.discountPercent > 0 ? (
                          <span className="t1 bg-[var(--blush)]/50 px-2 py-1 text-[var(--plum)]">
                            خصم {p.discountPercent}%
                          </span>
                        ) : null}
                        <span className="t2 text-[var(--muted)]" dir="ltr">
                          {p.id} · {p.categorySlug}
                        </span>
                      </div>
                      <h2 className="font-display t5 mt-2 text-[var(--plum)]">
                        {p.nameAr}
                      </h2>
                      <p className="t3 text-[var(--muted)]" dir="ltr">
                        {p.name} · {p.size}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="t3 font-medium text-[var(--plum)]">
                      {formatPrice(previewSale)}
                    </p>
                    {p.discountPercent > 0 ? (
                      <p className="t2 text-[var(--muted)] line-through">
                        {formatPrice(Number(draft.price) || p.price)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <label className="t2 cursor-pointer border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 text-[var(--plum)]">
                    {busy ? "جارٍ الرفع…" : "إضافة / تغيير الصورة"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        void uploadImage(p, f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {p.imageUrl ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeImage(p)}
                      className="t2 border border-red-200 bg-red-50 px-3 py-2 text-red-800 disabled:opacity-40"
                    >
                      حذف الصورة
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="t2 text-[var(--muted)]">
                      الاسم بالعربية
                    </label>
                    <input
                      value={draft.nameAr}
                      disabled={busy}
                      onChange={(e) =>
                        setDraft(p.id, { nameAr: e.target.value })
                      }
                      className="t3 mt-1 w-full border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 outline-none focus:border-[var(--plum)]"
                    />
                  </div>
                  <div>
                    <label className="t2 text-[var(--muted)]">
                      الاسم بالإنجليزية
                    </label>
                    <input
                      value={draft.name}
                      disabled={busy}
                      onChange={(e) =>
                        setDraft(p.id, { name: e.target.value })
                      }
                      className="t3 mt-1 w-full border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 outline-none focus:border-[var(--plum)]"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="t2 text-[var(--muted)]">
                      السعر الأساسي (د.ع)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={draft.price}
                      disabled={busy}
                      onChange={(e) =>
                        setDraft(p.id, { price: e.target.value })
                      }
                      className="t3 mt-1 w-full border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 outline-none focus:border-[var(--plum)]"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="t2 text-[var(--muted)]">المخزون</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={draft.stock}
                      disabled={busy}
                      onChange={(e) =>
                        setDraft(p.id, { stock: e.target.value })
                      }
                      className="t3 mt-1 w-full border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 outline-none focus:border-[var(--plum)]"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <p className="t2 text-[var(--muted)]">
                    خصم سريع من السعر الأساسي
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DISCOUNT_OPTIONS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        disabled={busy || p.discountPercent === pct}
                        onClick={() =>
                          void patchProduct(p.id, { discountPercent: pct })
                        }
                        className={`t2 px-3 py-2 transition disabled:opacity-40 ${
                          p.discountPercent === pct
                            ? "bg-[var(--plum)] text-[var(--ivory)]"
                            : "border border-[var(--plum)]/20 bg-[var(--mist)] text-[var(--plum)] hover:border-[var(--plum)]/50"
                        }`}
                      >
                        {pct === 0 ? "بدون خصم" : `${pct}%`}
                      </button>
                    ))}
                  </div>
                  {p.discountPercent > 0 ? (
                    <p className="t2 mt-2 text-[var(--plum)]">
                      السعر بعد الخصم: {formatPrice(p.salePrice)} (بدلاً من{" "}
                      {formatPrice(p.price)})
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !dirty}
                    onClick={() => void saveDetails(p)}
                    className="t2 border border-[var(--plum)] bg-[var(--plum)] px-3 py-2 text-[var(--ivory)] disabled:opacity-40"
                  >
                    {busy ? "جارٍ الحفظ…" : "حفظ الاسم والسعر والمخزون"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void patchProduct(p.id, { isActive: !p.isActive })
                    }
                    className="t2 border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 text-[var(--plum)] disabled:opacity-40"
                  >
                    {p.isActive ? "إخفاء من المتجر" : "إظهار في المتجر"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void patchProduct(p.id, {
                        isBestseller: !p.isBestseller,
                      })
                    }
                    className="t2 border border-[var(--plum)]/20 bg-white px-3 py-2 text-[var(--plum)] disabled:opacity-40"
                  >
                    {p.isBestseller
                      ? "إزالة الأكثر مبيعاً"
                      : "تعيين الأكثر مبيعاً"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void patchProduct(p.id, { isNew: !p.isNew })
                    }
                    className="t2 border border-[var(--plum)]/20 bg-white px-3 py-2 text-[var(--plum)] disabled:opacity-40"
                  >
                    {p.isNew ? "إزالة شارة جديد" : "تعيين كـ جديد"}
                  </button>
                </div>

                {savedId === p.id ? (
                  <p className="t2 mt-3 text-[var(--plum)]">تم الحفظ بنجاح.</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
