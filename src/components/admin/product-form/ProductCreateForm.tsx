"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  FileText,
  ImageIcon,
  Link2,
  Package,
  Sparkles,
  Store,
  Tags,
} from "lucide-react";
import { BrandCombobox } from "@/components/admin/product-form/BrandCombobox";
import { CategorySelector } from "@/components/admin/product-form/CategorySelector";
import { ImageDropzone } from "@/components/admin/product-form/ImageDropzone";
import { ChipMultiSelect, StringListEditor } from "@/components/admin/product-form/lists";
import {
  FormField,
  FormSection,
  PreviewCard,
  ProgressMeter,
  StickyFormActions,
  modernInputClass,
  modernTextareaClass,
} from "@/components/admin/product-form/primitives";
import type { AdminProduct } from "@/lib/admin-product-types";
import { ADMIN_CATEGORY_LABELS } from "@/lib/admin-product-types";
import { DISCOUNT_OPTIONS, salePriceFromBase } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import type { CategorySlug, SkinConcern } from "@/types";

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
      defaultCategorySlug === "skincare" ||
      defaultCategorySlug === "body-care" ||
      defaultCategorySlug === "hair-care" ||
      defaultCategorySlug === "makeup"
        ? defaultCategorySlug
        : EMPTY.categorySlug,
  }));
  const [file, setFile] = useState<File | null>(null);
  const [brandFile, setBrandFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const priceNum = Number(form.price) || 0;
  const sale = salePriceFromBase(priceNum, form.discountPercent);

  const essentials = useMemo(() => {
    const checks = [
      !!form.nameAr.trim() && !!form.name.trim(),
      !!form.brandName.trim(),
      !!form.categorySlug,
      !!form.size.trim() && priceNum > 0,
      !!form.descriptionAr.trim() && !!form.description.trim(),
      splitLines(form.benefitsAr).length > 0,
      splitLines(form.ingredients).length > 0,
      form.concerns.length > 0,
    ];
    return {
      completed: checks.filter(Boolean).length,
      total: checks.length,
    };
  }, [form, priceNum]);

  async function onSubmit(e: FormEvent, overrides?: { isActive?: boolean }) {
    e.preventDefault();
    setError(null);

    const price = Number(form.price);
    const stock = Number(form.stock);
    const rating = Number(form.rating);
    const reviews = Number(form.reviews);
    const benefitsAr = splitLines(form.benefitsAr);
    const benefits = splitLines(form.benefits);
    const ingredients = splitLines(form.ingredients);
    const isActive = overrides?.isActive ?? form.isActive;

    if (!form.name.trim() || !form.nameAr.trim()) {
      setError("اسم المنتج بالعربية والإنجليزية مطلوب.");
      return;
    }
    if (!form.brandName.trim()) {
      setError("اختاري براند من قائمة براندات المتجر.");
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
          isActive,
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
        if (!imgRes.ok || !imgJson.ok || !imgJson.product) {
          throw new Error(
            imgJson.error ||
              "تم إنشاء المنتج لكن فشل رفع الصورة. افتحي المنتج وأعيدي رفع الصورة.",
          );
        }
        product = imgJson.product;
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
        if (!imgRes.ok || !imgJson.ok || !imgJson.product) {
          throw new Error(
            imgJson.error ||
              "تم إنشاء المنتج لكن فشل رفع شعار العلامة. افتحي المنتج وأعيدي الرفع.",
          );
        }
        product = imgJson.product;
      }

      onCreated(product);
      setForm({
        ...EMPTY,
        categorySlug:
          defaultCategorySlug === "skincare" ||
          defaultCategorySlug === "body-care" ||
          defaultCategorySlug === "hair-care" ||
          defaultCategorySlug === "makeup"
            ? defaultCategorySlug
            : EMPTY.categorySlug,
      });
      setFile(null);
      setBrandFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إضافة المنتج.");
    } finally {
      setBusy(false);
    }
  }

  function onPickFile(next: File | null) {
    setFile(next);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="relative pb-28"
    >
      <header className="mb-6 space-y-4">
        <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--admin-text-muted)]">
          <Link href="/admin/products" className="hover:text-[var(--admin-plum)]">
            المنتجات
          </Link>
          <span>/</span>
          <span className="text-[var(--admin-text-secondary)]">إضافة منتج</span>
        </nav>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={onCancel}
              className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--admin-text-secondary)] transition hover:text-[var(--admin-plum)]"
            >
              <ArrowRight className="size-3.5 rotate-180" strokeWidth={1.7} />
              رجوع
            </button>
            <h1 className="text-[1.55rem] font-semibold tracking-tight text-[var(--admin-text)]">
              إضافة منتج جديد
            </h1>
            <p className="mt-1 max-w-xl text-[13.5px] leading-6 text-[var(--admin-text-secondary)]">
              أنشئي منتجاً أنيقاً وانشريه مباشرة في متجر VELORA مع البراند والتصنيف
              الصحيحين.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void onSubmit(
                  { preventDefault() {} } as FormEvent,
                  { isActive: false },
                )
              }
              className="inline-flex h-10 items-center rounded-[12px] border border-[var(--admin-border)] bg-white px-4 text-[13px] font-medium text-[var(--admin-text-secondary)] disabled:opacity-40"
            >
              حفظ كمسودة
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center rounded-[12px] bg-[var(--admin-plum)] px-4 text-[13px] font-medium text-white disabled:opacity-40"
            >
              {busy ? "جارٍ الإضافة…" : "إضافة المنتج"}
            </button>
          </div>
        </div>

        <ProgressMeter
          label="إعداد المنتج"
          completed={essentials.completed}
          total={essentials.total}
        />
      </header>

      {error ? (
        <div
          className="mb-5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)] lg:items-start lg:gap-6">
        <div className="space-y-5">
          <FormSection
            title="المعلومات الأساسية"
            subtitle="الاسم والحجم كما يظهران للعميلة"
            icon={Package}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="اسم المنتج · عربي">
                <input
                  required
                  value={form.nameAr}
                  onChange={(e) => set("nameAr", e.target.value)}
                  className={modernInputClass}
                  placeholder="سيروم فيلفت ديو"
                />
              </FormField>
              <FormField label="Product name · English">
                <input
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={modernInputClass}
                  dir="ltr"
                  placeholder="Velvet Dew Serum"
                />
              </FormField>
              <FormField label="الحجم / العبوة">
                <input
                  required
                  value={form.size}
                  onChange={(e) => set("size", e.target.value)}
                  className={modernInputClass}
                  dir="ltr"
                  placeholder="30ml"
                />
              </FormField>
              <FormField label="Slug (اختياري)" hint="يُنشأ تلقائياً من الاسم الإنجليزي إن تُرك فارغاً">
                <input
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  className={modernInputClass}
                  dir="ltr"
                  placeholder="velvet-dew-serum"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="البراند والتصنيف"
            subtitle="نفس مصادر البحث والفلاتر في المتجر"
            icon={Tags}
          >
            <div className="space-y-5">
              <FormField label="البراند">
                <BrandCombobox
                  required
                  value={form.brandName}
                  onChange={(brandName) => set("brandName", brandName)}
                />
              </FormField>
              <FormField label="التصنيف">
                <CategorySelector
                  value={form.categorySlug}
                  onChange={(slug) => set("categorySlug", slug)}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="وسائط المنتج"
            subtitle="صورة المنتج وشعار البراند"
            icon={ImageIcon}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[12px] font-medium text-[var(--admin-text-secondary)]">
                  صورة المنتج
                </p>
                <ImageDropzone
                  previewFile={file}
                  previewUrl={previewUrl}
                  busy={busy}
                  onFile={onPickFile}
                />
              </div>
              <div>
                <p className="mb-2 text-[12px] font-medium text-[var(--admin-text-secondary)]">
                  شعار العلامة (اختياري)
                </p>
                <ImageDropzone
                  compact
                  aspectClass="aspect-[5/3]"
                  previewFile={brandFile}
                  busy={busy}
                  onFile={setBrandFile}
                  hint="PNG شفاف مفضّل"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="التسعير والمخزون"
            subtitle="السعر بالدينار العراقي والمخزون الحالي"
            icon={BadgePercent}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="السعر الأساسي">
                <div className="relative">
                  <input
                    required
                    type="number"
                    min={0}
                    step={1000}
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    className={`${modernInputClass} pe-14`}
                    dir="ltr"
                  />
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-[12px] text-[var(--admin-text-muted)]">
                    د.ع
                  </span>
                </div>
              </FormField>
              <FormField label="المخزون">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  className={modernInputClass}
                  dir="ltr"
                />
              </FormField>
              <FormField label="التقييم">
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={form.rating}
                  onChange={(e) => set("rating", e.target.value)}
                  className={modernInputClass}
                  dir="ltr"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[12px] font-medium text-[var(--admin-text-secondary)]">
                الخصم
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DISCOUNT_OPTIONS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => set("discountPercent", pct)}
                    className={
                      form.discountPercent === pct
                        ? "h-9 rounded-full bg-[var(--admin-plum)] px-3.5 text-[12.5px] font-medium text-white"
                        : "h-9 rounded-full border border-[var(--admin-border)] bg-white px-3.5 text-[12.5px] font-medium text-[var(--admin-text-secondary)]"
                    }
                  >
                    {pct === 0 ? "بدون خصم" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[14px] bg-[var(--admin-bg-elevated)] px-4 py-3">
              <div className="flex justify-between text-[12.5px] text-[var(--admin-text-secondary)]">
                <span>السعر الأساسي</span>
                <span>{formatPrice(priceNum)}</span>
              </div>
              <div className="mt-1.5 flex justify-between text-[12.5px] text-[var(--admin-text-secondary)]">
                <span>الخصم</span>
                <span>{form.discountPercent}%</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-[var(--admin-border)] pt-2 text-[13px] font-semibold text-[var(--admin-plum)]">
                <span>السعر النهائي</span>
                <span>{formatPrice(sale)}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FormField label="عدد المراجعات">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.reviews}
                  onChange={(e) => set("reviews", e.target.value)}
                  className={modernInputClass}
                  dir="ltr"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="محتوى المنتج"
            subtitle="الوصف والفوائد والمكوّنات"
            icon={FileText}
          >
            <div className="mb-4 inline-flex rounded-full bg-[var(--admin-surface-soft)] p-1">
              {(
                [
                  ["ar", "العربية"],
                  ["en", "English"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLang(id)}
                  className={
                    lang === id
                      ? "rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--admin-plum)] shadow-sm"
                      : "rounded-full px-3.5 py-1.5 text-[12.5px] text-[var(--admin-text-muted)]"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {lang === "ar" ? (
              <div className="space-y-4">
                <FormField label="الوصف بالعربية">
                  <textarea
                    required
                    rows={4}
                    value={form.descriptionAr}
                    onChange={(e) => set("descriptionAr", e.target.value)}
                    className={modernTextareaClass}
                    placeholder="وصف أنيق للمنتج كما تراه العميلة…"
                  />
                </FormField>
                <FormField label="الفوائد بالعربية" hint="أضيفي فائدة ثم اضغطي Enter">
                  <StringListEditor
                    value={form.benefitsAr}
                    onChange={(v) => set("benefitsAr", v)}
                    placeholder="امتلاء فوري"
                    addLabel="فائدة"
                  />
                </FormField>
              </div>
            ) : (
              <div className="space-y-4">
                <FormField label="Description (English)">
                  <textarea
                    required
                    rows={4}
                    dir="ltr"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    className={modernTextareaClass}
                    placeholder="Elegant product description…"
                  />
                </FormField>
                <FormField label="Benefits (optional)">
                  <StringListEditor
                    value={form.benefits}
                    onChange={(v) => set("benefits", v)}
                    placeholder="Instant plump"
                    dir="ltr"
                    addLabel="Benefit"
                  />
                </FormField>
              </div>
            )}

            <div className="mt-5">
              <FormField
                label="المكوّنات الرئيسية"
                hint="أضيفي المكوّنات المفتاحية التي تصف المنتج"
              >
                <StringListEditor
                  value={form.ingredients}
                  onChange={(v) => set("ingredients", v)}
                  placeholder="Hyaluronic Acid"
                  dir="ltr"
                  addLabel="مكوّن"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="الاهتمامات الجمالية"
            subtitle="تظهر في فلاتر المتجر والمستشار"
            icon={Sparkles}
          >
            <ChipMultiSelect
              options={CONCERNS}
              value={form.concerns}
              onToggle={toggleConcern}
            />
          </FormSection>

          <FormSection
            title="الظهور في المتجر"
            subtitle="تحكّمي بما تراه العميلة"
            icon={Store}
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  {
                    key: "isActive" as const,
                    label: form.isActive ? "منشور" : "مخفي",
                    hint: "الظهور في المتجر",
                  },
                  {
                    key: "isBestseller" as const,
                    label: "الأكثر مبيعاً",
                    hint: "قسم الأكثر طلباً",
                  },
                  {
                    key: "isNew" as const,
                    label: "منتج جديد",
                    hint: "شارة جديد",
                  },
                ] as const
              ).map((item) => {
                const on = form[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => set(item.key, !on)}
                    className={
                      on
                        ? "rounded-[14px] border border-[var(--admin-plum)]/25 bg-[var(--admin-plum)]/[0.06] px-3.5 py-3 text-start"
                        : "rounded-[14px] border border-[var(--admin-border)] bg-white px-3.5 py-3 text-start"
                    }
                  >
                    <span className="block text-[13px] font-semibold text-[var(--admin-text)]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-[var(--admin-text-muted)]">
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </FormSection>

          <FormSection title="SEO وإعدادات المتجر" icon={Link2}>
            <FormField
              label="رابط المنتج (Slug)"
              hint="اتركيه فارغاً ليُنشأ تلقائياً من الاسم الإنجليزي"
            >
              <input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                className={modernInputClass}
                dir="ltr"
                placeholder="auto-from-english-name"
              />
            </FormField>
          </FormSection>
        </div>

        <div className="hidden lg:sticky lg:top-4 lg:block">
          <PreviewCard
            imageUrl={previewUrl}
            titleAr={form.nameAr}
            titleEn={form.name}
            brand={form.brandName}
            category={
              ADMIN_CATEGORY_LABELS[form.categorySlug] || form.categorySlug
            }
            priceLabel={formatPrice(sale)}
            stock={form.stock || "0"}
            published={form.isActive}
          />
          <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-[var(--admin-text-muted)]">
            <Boxes className="size-3.5" strokeWidth={1.6} />
            المعاينة تتحدّث مباشرة من بيانات النموذج
          </p>
        </div>
      </div>

      <StickyFormActions
        note={busy ? "جارٍ حفظ المنتج…" : "سيظهر المنتج في المتجر بعد الإضافة الناجحة"}
        right={
          <>
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-[12px] border border-[var(--admin-border)] bg-white px-4 text-[13px] font-medium sm:flex-none"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void onSubmit(
                  { preventDefault() {} } as FormEvent,
                  { isActive: false },
                )
              }
              className="inline-flex h-11 flex-1 items-center justify-center rounded-[12px] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-[13px] font-medium text-[var(--admin-text-secondary)] sm:flex-none"
            >
              مسودة
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 flex-[1.4] items-center justify-center rounded-[12px] bg-[var(--admin-plum)] px-5 text-[13px] font-medium text-white disabled:opacity-40 sm:flex-none sm:min-w-[10rem]"
            >
              {busy ? "جارٍ الإضافة…" : "إضافة المنتج"}
            </button>
          </>
        }
      />
    </form>
  );
}
