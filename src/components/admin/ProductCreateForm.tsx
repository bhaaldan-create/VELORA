"use client";

import { FormEvent, useState } from "react";
import type { AdminProduct } from "@/lib/admin-product-types";
import { DISCOUNT_OPTIONS } from "@/lib/pricing";
import type { CategorySlug, SkinConcern } from "@/types";

const CATEGORIES: { slug: CategorySlug; label: string }[] = [
  { slug: "skincare", label: "العناية بالبشرة" },
  { slug: "body-care", label: "العناية بالجسم" },
  { slug: "hair-care", label: "العناية بالشعر" },
  { slug: "makeup", label: "المكياج" },
];

const CONCERNS: { id: SkinConcern; label: string }[] = [
  { id: "hydration", label: "ترطيب" },
  { id: "glow", label: "إشراقة" },
  { id: "acne", label: "حبوب / تنقية" },
  { id: "anti-aging", label: "تماسك / خطوط" },
  { id: "sensitivity", label: "حساسية" },
  { id: "oil-control", label: "لمعان / دهون" },
];

const EMPTY = {
  name: "",
  nameAr: "",
  categorySlug: "skincare" as CategorySlug,
  brandName: "",
  price: "",
  stock: "100",
  discountPercent: 0,
  size: "",
  description: "",
  descriptionAr: "",
  benefits: "",
  benefitsAr: "",
  ingredients: "",
  concerns: [] as SkinConcern[],
  isActive: true,
  isBestseller: false,
  isNew: true,
  rating: "5",
  reviews: "0",
  slug: "",
};

function splitLines(value: string) {
  return value
    .split(/[\n,،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ProductCreateForm({
  onCreated,
  onCancel,
  defaultCategorySlug,
}: {
  onCreated: (product: AdminProduct) => void;
  onCancel: () => void;
  defaultCategorySlug?: CategorySlug;
}) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    categorySlug:
      defaultCategorySlug &&
      CATEGORIES.some((c) => c.slug === defaultCategorySlug)
        ? defaultCategorySlug
        : EMPTY.categorySlug,
  }));
  const [file, setFile] = useState<File | null>(null);
  const [brandFile, setBrandFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleConcern(id: SkinConcern) {
    setForm((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(id)
        ? prev.concerns.filter((c) => c !== id)
        : [...prev.concerns, id],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const price = Number(form.price);
    const stock = Number(form.stock);
    const rating = Number(form.rating);
    const reviews = Number(form.reviews);
    const benefitsAr = splitLines(form.benefitsAr);
    const benefits = splitLines(form.benefits);
    const ingredients = splitLines(form.ingredients);

    if (!form.name.trim() || !form.nameAr.trim()) {
      setError("اسم المنتج بالعربية والإنجليزية مطلوب.");
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) {
      setError("السعر يجب أن يكون رقماً صحيحاً غير سالب.");
      return;
    }
    if (!form.size.trim()) {
      setError("الحجم / العبوة مطلوب (مثل 30ml).");
      return;
    }
    if (!form.descriptionAr.trim() || !form.description.trim()) {
      setError("الوصف بالعربية والإنجليزية مطلوب.");
      return;
    }
    if (!benefitsAr.length) {
      setError("أضيفي فائدة واحدة على الأقل بالعربية.");
      return;
    }
    if (!ingredients.length) {
      setError("أضيفي مكوّناً واحداً على الأقل.");
      return;
    }
    if (!form.concerns.length) {
      setError("اختاري اهتماماً جمالياً واحداً على الأقل.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          nameAr: form.nameAr.trim(),
          categorySlug: form.categorySlug,
          brandName: form.brandName.trim() || null,
          price,
          stock: Number.isFinite(stock) ? Math.round(stock) : 100,
          discountPercent: form.discountPercent,
          size: form.size.trim(),
          description: form.description.trim(),
          descriptionAr: form.descriptionAr.trim(),
          benefits: benefits.length ? benefits : benefitsAr,
          benefitsAr,
          ingredients,
          concerns: form.concerns,
          isActive: form.isActive,
          isBestseller: form.isBestseller,
          isNew: form.isNew,
          rating: Number.isFinite(rating) ? rating : 5,
          reviews: Number.isFinite(reviews) ? Math.round(reviews) : 0,
          slug: form.slug.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        product?: AdminProduct;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.product) {
        throw new Error(json.error || "تعذّر إضافة المنتج.");
      }

      let product = json.product;

      if (file) {
        const fd = new FormData();
        fd.set("id", product.id);
        fd.set("file", file);
        const imgRes = await fetch("/api/admin/products/image", {
          method: "POST",
          body: fd,
        });
        const imgJson = (await imgRes.json()) as {
          ok?: boolean;
          product?: AdminProduct;
          error?: string;
        };
        if (imgRes.ok && imgJson.ok && imgJson.product) {
          product = imgJson.product;
        }
      }

      if (brandFile) {
        const fd = new FormData();
        fd.set("id", product.id);
        fd.set("kind", "brandLogo");
        fd.set("file", brandFile);
        const imgRes = await fetch("/api/admin/products/image", {
          method: "POST",
          body: fd,
        });
        const imgJson = (await imgRes.json()) as {
          ok?: boolean;
          product?: AdminProduct;
          error?: string;
        };
        if (imgRes.ok && imgJson.ok && imgJson.product) {
          product = imgJson.product;
        }
      }

      onCreated(product);
      setForm({
        ...EMPTY,
        categorySlug:
          defaultCategorySlug &&
          CATEGORIES.some((c) => c.slug === defaultCategorySlug)
            ? defaultCategorySlug
            : EMPTY.categorySlug,
      });
      setFile(null);
      setBrandFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إضافة المنتج.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 border border-[var(--plum)]/15 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display t5 text-[var(--plum)]">إضافة منتج جديد</h2>
          <p className="t3 mt-1 text-[var(--muted)]">
            أدخلي كل بيانات المنتج كما تظهر في المتجر ولارسا.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="t2 border border-[var(--plum)]/20 px-3 py-2 text-[var(--plum)]"
        >
          إلغاء
        </button>
      </div>

      {error ? (
        <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم بالعربية">
          <input
            required
            value={form.nameAr}
            onChange={(e) => set("nameAr", e.target.value)}
            className={inputClass}
            placeholder="مثال: سيروم فيلفت ديو"
          />
        </Field>
        <Field label="الاسم بالإنجليزية">
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
            dir="ltr"
            placeholder="Velvet Dew Serum"
          />
        </Field>
        <Field label="التصنيف">
          <select
            value={form.categorySlug}
            onChange={(e) => set("categorySlug", e.target.value as CategorySlug)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="اسم العلامة التجارية (اختياري)">
          <input
            value={form.brandName}
            onChange={(e) => set("brandName", e.target.value)}
            className={inputClass}
            dir="ltr"
            placeholder="L’Oréal Paris"
          />
        </Field>
        <Field label="الحجم / العبوة">
          <input
            required
            value={form.size}
            onChange={(e) => set("size", e.target.value)}
            className={inputClass}
            dir="ltr"
            placeholder="30ml"
          />
        </Field>
        <Field label="السعر الأساسي (د.ع)">
          <input
            required
            type="number"
            min={0}
            step={1000}
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label="المخزون">
          <input
            type="number"
            min={0}
            step={1}
            value={form.stock}
            onChange={(e) => set("stock", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label="رابط slug (اختياري)">
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className={inputClass}
            dir="ltr"
            placeholder="يُنشأ تلقائياً من الاسم الإنجليزي"
          />
        </Field>
        <Field label="التقييم (0–5)">
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={form.rating}
            onChange={(e) => set("rating", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label="عدد المراجعات">
          <input
            type="number"
            min={0}
            step={1}
            value={form.reviews}
            onChange={(e) => set("reviews", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
      </div>

      <div>
        <p className="t2 text-[var(--muted)]">نسبة الخصم</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DISCOUNT_OPTIONS.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => set("discountPercent", pct)}
              className={`t2 px-3 py-2 ${
                form.discountPercent === pct
                  ? "bg-[var(--plum)] text-[var(--ivory)]"
                  : "border border-[var(--plum)]/20 bg-[var(--mist)] text-[var(--plum)]"
              }`}
            >
              {pct === 0 ? "بدون خصم" : `${pct}%`}
            </button>
          ))}
        </div>
      </div>

      <Field label="الوصف بالعربية">
        <textarea
          required
          rows={3}
          value={form.descriptionAr}
          onChange={(e) => set("descriptionAr", e.target.value)}
          className={inputClass}
          placeholder="وصف المنتج كما تراه العميلة…"
        />
      </Field>
      <Field label="الوصف بالإنجليزية">
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
          dir="ltr"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الفوائد بالعربية (سطر أو فاصلة)">
          <textarea
            required
            rows={3}
            value={form.benefitsAr}
            onChange={(e) => set("benefitsAr", e.target.value)}
            className={inputClass}
            placeholder={"امتلاء فوري\nدعم الحاجز الجلدي"}
          />
        </Field>
        <Field label="الفوائد بالإنجليزية (اختياري)">
          <textarea
            rows={3}
            value={form.benefits}
            onChange={(e) => set("benefits", e.target.value)}
            className={inputClass}
            dir="ltr"
            placeholder={"Instant plump\nBarrier support"}
          />
        </Field>
      </div>

      <Field label="المكوّنات (سطر أو فاصلة)">
        <textarea
          required
          rows={2}
          value={form.ingredients}
          onChange={(e) => set("ingredients", e.target.value)}
          className={inputClass}
          dir="ltr"
          placeholder="Hyaluronic Acid, Niacinamide"
        />
      </Field>

      <div>
        <p className="t2 text-[var(--muted)]">الاهتمامات الجمالية</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONCERNS.map((c) => {
            const on = form.concerns.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleConcern(c.id)}
                className={`t2 px-3 py-2 ${
                  on
                    ? "bg-[var(--plum)] text-[var(--ivory)]"
                    : "border border-[var(--plum)]/20 bg-[var(--mist)] text-[var(--plum)]"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Toggle
          label={form.isActive ? "ظاهر في المتجر" : "مخفي"}
          on={form.isActive}
          onClick={() => set("isActive", !form.isActive)}
        />
        <Toggle
          label="الأكثر مبيعاً"
          on={form.isBestseller}
          onClick={() => set("isBestseller", !form.isBestseller)}
        />
        <Toggle
          label="جديد"
          on={form.isNew}
          onClick={() => set("isNew", !form.isNew)}
        />
      </div>

      <div>
        <label className="t2 text-[var(--muted)]">صورة المنتج (اختياري)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="t3 mt-2 block w-full"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p className="t2 mt-1 text-[var(--muted)]">
          JPG / PNG / WebP — حتى 12 ميجابايت
        </p>
      </div>

      <div>
        <label className="t2 text-[var(--muted)]">
          شعار العلامة التجارية (اختياري)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="t3 mt-2 block w-full"
          onChange={(e) => setBrandFile(e.target.files?.[0] || null)}
        />
        <p className="t2 mt-1 text-[var(--muted)]">
          يُعرض فوق عنوان المنتج في صفحة التفاصيل — يُفضّل PNG شفاف
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="t2 bg-[var(--plum)] px-5 py-3 text-[var(--ivory)] disabled:opacity-40"
        >
          {busy ? "جارٍ الإضافة…" : "إضافة المنتج إلى المتجر"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="t2 border border-[var(--plum)]/20 px-5 py-3 text-[var(--plum)]"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="t2 text-[var(--muted)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`t2 px-3 py-2 ${
        on
          ? "bg-[var(--plum)] text-[var(--ivory)]"
          : "border border-[var(--plum)]/20 bg-white text-[var(--plum)]"
      }`}
    >
      {label}
    </button>
  );
}

const inputClass =
  "t3 w-full border border-[var(--plum)]/20 bg-[var(--mist)] px-3 py-2 outline-none focus:border-[var(--plum)]";
