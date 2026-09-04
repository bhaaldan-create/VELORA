"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  AlignCenter,
  AlignRight,
  Bold,
  Eye,
  ImagePlus,
  Italic,
  Link2,
  List,
  MoreHorizontal,
  Package,
  Trash2,
  X,
} from "lucide-react";
import { AdminBrandSelect } from "@/components/admin/AdminBrandSelect";
import { CategorySelector } from "@/components/admin/product-form/CategorySelector";
import { ImageDropzone } from "@/components/admin/product-form/ImageDropzone";
import {
  FormField,
  FormSection,
  PreviewCard,
  StickyFormActions,
  modernInputClass,
  modernTextareaClass,
} from "@/components/admin/product-form/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";
import {
  ADMIN_CATEGORY_LABELS,
  type AdminProductDetail,
} from "@/lib/admin-product-types";
import { shopBrands } from "@/data/shop-brands";
import { DISCOUNT_OPTIONS, salePriceFromBase } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import type { CategorySlug } from "@/types";

type Draft = {
  name: string;
  nameAr: string;
  size: string;
  categorySlug: string;
  slug: string;
  price: string;
  discountPercent: number;
  customSale: boolean;
  customSalePrice: string;
  stock: string;
  descriptionAr: string;
  description: string;
  benefitsAr: string[];
  brandName: string;
  skinTypes: string[];
  productType: string;
  featureTags: string[];
  supplierId: string;
  costCurrency: string;
  costExchangeRate: string;
  purchasePrice: string;
  shippingCostIqd: string;
  customsCostIqd: string;
  brokerageCostIqd: string;
  handlingCostIqd: string;
  otherCostIqd: string;
  minMarginPct: string;
  isActive: boolean;
  isBestseller: boolean;
  isNew: boolean;
  specialOffer: boolean;
};

function draftFromProduct(p: AdminProductDetail): Draft {
  return {
    name: p.name,
    nameAr: p.nameAr,
    size: p.size,
    categorySlug: p.categorySlug,
    slug: p.slug,
    price: String(p.price),
    discountPercent: p.discountPercent,
    customSale: false,
    customSalePrice: String(p.salePrice),
    stock: String(p.stock),
    descriptionAr: p.descriptionAr,
    description: p.description,
    benefitsAr: [...p.benefitsAr],
    brandName: p.brandName || "",
    skinTypes: [...(p.skinTypes || [])],
    productType: p.productType || "",
    featureTags: [...(p.featureTags || [])],
    supplierId: p.supplierId || "",
    costCurrency: p.costCurrency,
    costExchangeRate: String(p.costExchangeRate),
    purchasePrice: String(p.purchasePrice),
    shippingCostIqd: String(p.shippingCostIqd),
    customsCostIqd: String(p.customsCostIqd),
    brokerageCostIqd: String(p.brokerageCostIqd),
    handlingCostIqd: String(p.handlingCostIqd),
    otherCostIqd: String(p.otherCostIqd),
    minMarginPct: String(p.minMarginPct),
    isActive: p.isActive,
    isBestseller: p.isBestseller,
    isNew: p.isNew,
    specialOffer: p.discountPercent > 0,
  };
}

function stockTone(stock: number) {
  if (stock <= 0) return "out" as const;
  if (stock <= 10) return "low" as const;
  return "ok" as const;
}

function SectionCard({
  title,
  children,
  action,
  subtitle,
  icon,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  subtitle?: string;
  icon?: typeof Package;
}) {
  return (
    <FormSection title={title} subtitle={subtitle} icon={icon} action={action}>
      {children}
    </FormSection>
  );
}

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string | null;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <FormField label={label} error={error} hint={hint}>
      {children}
    </FormField>
  );
}

const inputClass = modernInputClass;

export function ProductEditor({
  initialProduct,
}: {
  initialProduct: AdminProductDetail;
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const brandFileRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const [product, setProduct] = useState(initialProduct);
  const [draft, setDraft] = useState(() => draftFromProduct(initialProduct));
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [brandBusy, setBrandBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
    "mobile",
  );
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [descAlign, setDescAlign] = useState<"right" | "center">("right");

  useEffect(() => {
    void fetch("/api/admin/suppliers")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && Array.isArray(j.suppliers)) {
          setSuppliers(
            j.suppliers.map((s: { id: string; name: string }) => ({
              id: s.id,
              name: s.name,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const basePrice = Number(draft.price) || 0;
  const previewSale = draft.customSale
    ? Number(draft.customSalePrice) || 0
    : salePriceFromBase(basePrice, draft.discountPercent);
  const costRate = draft.costCurrency === "IQD" ? 1 : Number(draft.costExchangeRate) || 0;
  const landedCost =
    (Number(draft.purchasePrice) || 0) * costRate +
    (Number(draft.shippingCostIqd) || 0) +
    (Number(draft.customsCostIqd) || 0) +
    (Number(draft.brokerageCostIqd) || 0) +
    (Number(draft.handlingCostIqd) || 0) +
    (Number(draft.otherCostIqd) || 0);
  const grossMargin = previewSale > 0 && landedCost > 0
    ? ((previewSale - landedCost) / previewSale) * 100
    : null;

  const dirty = useMemo(() => {
    const base = draftFromProduct(product);
    return (
      draft.name !== base.name ||
      draft.nameAr !== base.nameAr ||
      draft.size !== base.size ||
      draft.categorySlug !== base.categorySlug ||
      draft.slug !== base.slug ||
      draft.price !== base.price ||
      draft.discountPercent !== base.discountPercent ||
      draft.customSale !== base.customSale ||
      (draft.customSale && draft.customSalePrice !== String(product.salePrice)) ||
      draft.stock !== base.stock ||
      draft.descriptionAr !== base.descriptionAr ||
      draft.description !== base.description ||
      draft.isActive !== base.isActive ||
      draft.isBestseller !== base.isBestseller ||
      draft.isNew !== base.isNew ||
      draft.specialOffer !== base.specialOffer ||
      draft.brandName !== base.brandName ||
      draft.productType !== base.productType ||
      JSON.stringify(draft.skinTypes) !== JSON.stringify(base.skinTypes) ||
      JSON.stringify(draft.featureTags) !== JSON.stringify(base.featureTags) ||
      draft.supplierId !== base.supplierId ||
      draft.costCurrency !== base.costCurrency ||
      draft.costExchangeRate !== base.costExchangeRate ||
      draft.purchasePrice !== base.purchasePrice ||
      draft.shippingCostIqd !== base.shippingCostIqd ||
      draft.customsCostIqd !== base.customsCostIqd ||
      draft.brokerageCostIqd !== base.brokerageCostIqd ||
      draft.handlingCostIqd !== base.handlingCostIqd ||
      draft.otherCostIqd !== base.otherCostIqd ||
      draft.minMarginPct !== base.minMarginPct ||
      JSON.stringify(draft.benefitsAr) !== JSON.stringify(base.benefitsAr)
    );
  }, [draft, product]);

  const categoryLabel =
    ADMIN_CATEGORY_LABELS[draft.categorySlug] ||
    ADMIN_CATEGORY_LABELS[product.categorySlug] ||
    product.categorySlug;

  const stockStatus = stockTone(Number(draft.stock) || 0);

  const patchDraft = useCallback((patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function requestLeave(href: string) {
    if (!dirty) {
      router.push(href);
      return;
    }
    setPendingHref(href);
    setLeaveOpen(true);
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!draft.nameAr.trim()) next.nameAr = "الاسم بالعربية مطلوب.";
    if (!draft.name.trim()) next.name = "الاسم بالإنجليزية مطلوب.";
    if (!draft.size.trim()) next.size = "الحجم مطلوب.";
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) {
      next.price = "السعر يجب أن يكون رقماً صحيحاً غير سالب.";
    }
    const stock = Number(draft.stock);
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      next.stock = "المخزون يجب أن يكون رقماً صحيحاً غير سالب.";
    }
    if (draft.customSale) {
      const sale = Number(draft.customSalePrice);
      if (!Number.isFinite(sale) || sale < 0 || !Number.isInteger(sale)) {
        next.customSalePrice = "السعر النهائي غير صالح.";
      }
    }
    if (!draft.descriptionAr.trim()) {
      next.descriptionAr = "وصف المنتج مطلوب.";
    }
    // Brand optional on edit (many legacy products have none) — if set, must be official
    if (draft.brandName.trim()) {
      const known = shopBrands.some((b) => b.name === draft.brandName.trim());
      if (!known) {
        next.brandName = "اختاري براند من قائمة براندات المتجر الرسمية.";
      }
    }
    setErrors(next);
    return next;
  }

  async function saveAll() {
    if (saving) return;
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      const first = Object.values(validation)[0] || "راجعي الحقول المطلوبة.";
      toast.error(first);
      if (validation.brandName) {
        document
          .getElementById("admin-product-brand")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setSaving(true);
    try {
      let price = Math.round(Number(draft.price));
      let discountPercent = draft.discountPercent;
      if (draft.customSale) {
        price = Math.round(Number(draft.customSalePrice));
        discountPercent = 0;
      } else if (draft.specialOffer && discountPercent === 0) {
        discountPercent = 20;
      } else if (!draft.specialOffer && discountPercent > 0) {
        // keep discount chips as source of truth unless specialOffer off means clear
      }

      const finite = (raw: string, fallback = 0) => {
        const n = Number(raw);
        return Number.isFinite(n) ? n : fallback;
      };

      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          name: draft.name.trim(),
          nameAr: draft.nameAr.trim(),
          size: draft.size.trim(),
          categorySlug: draft.categorySlug,
          slug: draft.slug.trim() || undefined,
          price,
          discountPercent,
          stock: Math.round(Number(draft.stock)),
          descriptionAr: draft.descriptionAr.trim(),
          description: draft.description.trim() || draft.descriptionAr.trim(),
          benefitsAr: draft.benefitsAr,
          benefits: draft.benefitsAr,
          isActive: draft.isActive,
          isBestseller: draft.isBestseller,
          isNew: draft.isNew,
          brandName: draft.brandName.trim() || null,
          skinTypes: draft.skinTypes,
          productType: draft.productType.trim() || null,
          featureTags: draft.featureTags,
          supplierId: draft.supplierId.trim() || null,
          costCurrency: draft.costCurrency,
          costExchangeRate:
            draft.costCurrency === "IQD" ? 1 : finite(draft.costExchangeRate, 1),
          purchasePrice: finite(draft.purchasePrice),
          shippingCostIqd: finite(draft.shippingCostIqd),
          customsCostIqd: finite(draft.customsCostIqd),
          brokerageCostIqd: finite(draft.brokerageCostIqd),
          handlingCostIqd: finite(draft.handlingCostIqd),
          otherCostIqd: finite(draft.otherCostIqd),
          minMarginPct: finite(draft.minMarginPct),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        product?: AdminProductDetail;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.product) {
        throw new Error(json.error || "تعذّر حفظ التغييرات.");
      }
      setProduct(json.product);
      setDraft(draftFromProduct(json.product));
      toast.success("تم حفظ التغييرات بنجاح");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File | null) {
    if (!file) return;
    setImageBusy(true);
    try {
      const form = new FormData();
      form.set("id", product.id);
      form.set("file", file);
      const res = await fetch("/api/admin/products/image", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        product?: AdminProductDetail;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.product) {
        throw new Error(json.error || "تعذّر رفع الصورة.");
      }
      // image endpoint returns list shape — merge into detail
      const merged = { ...product, ...json.product };
      setProduct(merged);
      toast.success("تم تحديث صورة المنتج");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر رفع الصورة.");
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeImage() {
    setImageBusy(true);
    try {
      const res = await fetch("/api/admin/products/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        product?: AdminProductDetail;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.product) {
        throw new Error(json.error || "تعذّر حذف الصورة.");
      }
      setProduct({ ...product, ...json.product, imageUrl: null });
      toast.success("تم حذف الصورة");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر حذف الصورة.");
    } finally {
      setImageBusy(false);
    }
  }

  async function uploadBrandLogo(file: File | null) {
    if (!file) return;
    setBrandBusy(true);
    try {
      const form = new FormData();
      form.set("id", product.id);
      form.set("kind", "brandLogo");
      form.set("file", file);
      const res = await fetch("/api/admin/products/image", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        product?: AdminProductDetail;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.product) {
        throw new Error(json.error || "تعذّر رفع شعار العلامة.");
      }
      setProduct({ ...product, ...json.product });
      toast.success("تم تحديث شعار العلامة");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر رفع الشعار.");
    } finally {
      setBrandBusy(false);
      if (brandFileRef.current) brandFileRef.current.value = "";
    }
  }

  async function removeBrandLogo() {
    setBrandBusy(true);
    try {
      const res = await fetch("/api/admin/products/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, kind: "brandLogo" }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        product?: AdminProductDetail;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.product) {
        throw new Error(json.error || "تعذّر حذف الشعار.");
      }
      setProduct({ ...product, ...json.product, brandLogoUrl: null });
      toast.success("تم حذف شعار العلامة");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر حذف الشعار.");
    } finally {
      setBrandBusy(false);
    }
  }

  async function deleteProduct() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "تعذّر حذف المنتج.");
      }
      toast.success("تم حذف المنتج");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر الحذف.");
      setSaving(false);
    }
  }

  function addTag() {
    const value = tagInput.trim();
    if (!value) return;
    if (draft.benefitsAr.includes(value)) {
      setTagInput("");
      return;
    }
    patchDraft({ benefitsAr: [...draft.benefitsAr, value] });
    setTagInput("");
  }

  function wrapSelection(before: string, after = before) {
    const el = descRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = draft.descriptionAr;
    const selected = text.slice(start, end) || "نص";
    const next =
      text.slice(0, start) + before + selected + after + text.slice(end);
    patchDraft({ descriptionAr: next });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + selected.length + after.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    void uploadImage(f);
  }

  return (
    <div className="pb-36 sm:pb-28 lg:pb-24">
      {/* Header */}
      <header className="mb-6 space-y-4">
        <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--admin-text-muted)]">
          <button
            type="button"
            onClick={() => requestLeave("/admin/products")}
            className="hover:text-[var(--admin-plum)]"
          >
            المنتجات
          </button>
          <span>/</span>
          <span>{categoryLabel}</span>
          <span>/</span>
          <span className="text-[var(--admin-text-secondary)]">تعديل المنتج</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-[1.55rem] font-semibold leading-tight tracking-tight text-[var(--admin-plum)] sm:text-[1.75rem]">
              {draft.nameAr || product.nameAr}
            </h1>
            <p className="mt-1 text-[13.5px] text-[var(--admin-text-secondary)]" dir="ltr">
              {draft.name || product.name}
              {draft.size ? ` · ${draft.size}` : ""}
            </p>
            <p className="mt-2 text-[13px] text-[var(--admin-text-muted)]">
              {formatPrice(previewSale)}
              {draft.discountPercent > 0 && !draft.customSale ? (
                <span className="ms-2 line-through opacity-60">
                  {formatPrice(basePrice)}
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${
                draft.isActive
                  ? "bg-[var(--admin-success-bg)] text-[var(--admin-success)]"
                  : "bg-[var(--admin-surface-mute)] text-[var(--admin-text-muted)]"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  draft.isActive
                    ? "bg-[var(--admin-success)]"
                    : "bg-[var(--admin-text-muted)]"
                }`}
              />
              {draft.isActive ? "ظاهر في المتجر" : "مخفي من المتجر"}
            </span>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[var(--admin-border)] bg-white px-3 text-[12.5px] font-medium text-[var(--admin-text)]"
            >
              <Eye className="size-3.5" strokeWidth={1.7} />
              معاينة المنتج
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex size-9 items-center justify-center rounded-[10px] border border-[var(--admin-border)] bg-white text-[var(--admin-text)]"
                aria-label="المزيد"
              >
                <MoreHorizontal className="size-4" strokeWidth={1.7} />
              </button>
              {menuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-20 cursor-default"
                    aria-label="إغلاق"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-30 mt-1 min-w-[10rem] overflow-hidden rounded-[12px] border border-[var(--admin-border)] bg-white py-1 shadow-[var(--admin-shadow-md)]">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-start text-[13px] text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg)]"
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteOpen(true);
                      }}
                    >
                      حذف المنتج
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.36fr)] lg:items-start lg:gap-6">
        <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-6">
        {/* Media */}
        <SectionCard
          title="صور المنتج"
          subtitle="اسحبي الصورة أو ارفعيها مباشرة"
          icon={ImagePlus}
        >
          <ImageDropzone
            previewUrl={product.imageUrl}
            busy={imageBusy}
            onFile={(f) => void uploadImage(f)}
            onRemove={() => void removeImage()}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={onFileChange}
          />
        </SectionCard>

        <SectionCard
          title="البراند والعلامة"
          subtitle="من براندات المتجر الرسمية"
          icon={Package}
        >
          <input
            ref={brandFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              void uploadBrandLogo(f);
            }}
          />
          <div className="space-y-4">
            <Field
              label="اسم العلامة"
              hint="نفس قائمة البحث والفلاتر — اختياري للمنتجات القديمة"
              error={errors.brandName}
            >
              <div id="admin-product-brand">
                <AdminBrandSelect
                  value={draft.brandName}
                  onChange={(brandName) => patchDraft({ brandName })}
                />
              </div>
            </Field>

            <div>
              <p className="mb-2 text-[12px] font-medium text-[var(--admin-text-secondary)]">
                شعار العلامة
              </p>
              <ImageDropzone
                compact
                aspectClass="aspect-[5/3]"
                previewUrl={product.brandLogoUrl}
                busy={brandBusy}
                onFile={(f) => void uploadBrandLogo(f)}
                onRemove={() => void removeBrandLogo()}
                hint="PNG شفاف مفضّل"
              />
            </div>
          </div>
        </SectionCard>
      </div>

        {/* Basic info */}
        <SectionCard
          title="معلومات المنتج"
          subtitle="الأسماء والتصنيف والرابط"
          icon={Package}
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="الاسم بالعربية" error={errors.nameAr}>
              <input
                className={inputClass}
                value={draft.nameAr}
                onChange={(e) => patchDraft({ nameAr: e.target.value })}
                autoFocus
              />
            </Field>
            <Field label="الاسم بالإنجليزية" error={errors.name}>
              <input
                className={inputClass}
                dir="ltr"
                value={draft.name}
                onChange={(e) => patchDraft({ name: e.target.value })}
              />
            </Field>
            <Field label="الحجم" error={errors.size}>
              <input
                className={inputClass}
                dir="ltr"
                value={draft.size}
                onChange={(e) => patchDraft({ size: e.target.value })}
                placeholder="100ml"
              />
            </Field>
            <Field label="SKU" hint="معرّف الرابط في المتجر">
              <input
                className={inputClass}
                dir="ltr"
                value={draft.slug}
                onChange={(e) => patchDraft({ slug: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="الفئة">
                <CategorySelector
                  value={draft.categorySlug}
                  onChange={(slug) => patchDraft({ categorySlug: slug })}
                />
              </Field>
            </div>
            <Field label="المعرّف" hint="ثابت — للمرجع الداخلي فقط">
              <input
                className={`${inputClass} opacity-70`}
                dir="ltr"
                value={product.id}
                readOnly
                disabled
              />
            </Field>
          </div>
        </SectionCard>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Pricing */}
        <SectionCard title="التسعير والخصم">
          <Field label="السعر الأساسي" error={errors.price}>
            <div className="relative">
              <input
                className={`${inputClass} pe-14`}
                dir="ltr"
                type="number"
                min={0}
                step={1000}
                value={draft.price}
                disabled={draft.customSale}
                onChange={(e) => patchDraft({ price: e.target.value })}
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[12px] text-[var(--admin-text-muted)]">
                د.ع
              </span>
            </div>
          </Field>

          {!draft.customSale ? (
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-medium text-[var(--admin-text-secondary)]">
                الخصم السريع
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DISCOUNT_OPTIONS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() =>
                      patchDraft({
                        discountPercent: pct,
                        specialOffer: pct > 0,
                      })
                    }
                    className={`h-8 rounded-full px-3 text-[12px] font-medium transition ${
                      draft.discountPercent === pct
                        ? "bg-[var(--admin-plum)] text-white"
                        : "border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] text-[var(--admin-text-secondary)]"
                    }`}
                  >
                    {pct === 0 ? "بدون خصم" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-[12px] bg-[var(--admin-bg-elevated)] px-4 py-3">
            <div className="flex items-baseline justify-between gap-3 text-[12.5px] text-[var(--admin-text-secondary)]">
              <span>السعر الأساسي</span>
              <span className="admin-num">{formatPrice(basePrice)}</span>
            </div>
            {!draft.customSale ? (
              <div className="mt-1.5 flex items-baseline justify-between gap-3 text-[12.5px] text-[var(--admin-text-secondary)]">
                <span>الخصم</span>
                <span className="admin-num">{draft.discountPercent}%</span>
              </div>
            ) : null}
            <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-[var(--admin-border)] pt-2">
              <span className="text-[13px] font-medium text-[var(--admin-text)]">
                السعر بعد الخصم
              </span>
              <span className="admin-num text-[15px] font-semibold text-[var(--admin-plum)]">
                {formatPrice(previewSale)}
              </span>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-[var(--admin-border)] px-3.5 py-3">
            <span className="text-[13px] text-[var(--admin-text)]">
              استخدام سعر مخصص
            </span>
            <input
              type="checkbox"
              className="peer sr-only"
              checked={draft.customSale}
              onChange={(e) => {
                const on = e.target.checked;
                patchDraft({
                  customSale: on,
                  customSalePrice: on
                    ? String(previewSale)
                    : draft.customSalePrice,
                  discountPercent: on ? 0 : draft.discountPercent,
                });
              }}
            />
            <span
              className={`relative h-5 w-9 rounded-full transition ${
                draft.customSale
                  ? "bg-[var(--admin-plum)]"
                  : "bg-[var(--admin-surface-mute)]"
              }`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition ${
                  draft.customSale ? "right-0.5" : "right-4"
                }`}
              />
            </span>
          </label>

          {draft.customSale ? (
            <div className="mt-3">
              <Field label="السعر النهائي" error={errors.customSalePrice}>
                <input
                  className={inputClass}
                  dir="ltr"
                  type="number"
                  min={0}
                  step={1000}
                  value={draft.customSalePrice}
                  onChange={(e) =>
                    patchDraft({ customSalePrice: e.target.value })
                  }
                />
              </Field>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="التكلفة والربحية">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="المورد">
              <select
                className={inputClass}
                value={draft.supplierId}
                onChange={(e) => patchDraft({ supplierId: e.target.value })}
              >
                <option value="">— بدون مورد —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="عملة الشراء"><select className={inputClass} value={draft.costCurrency} onChange={(e) => patchDraft({ costCurrency: e.target.value })}><option value="IQD">IQD</option><option value="USD">USD</option></select></Field>
            <Field label="سعر الصرف"><input className={inputClass} type="number" min={0} disabled={draft.costCurrency === "IQD"} value={draft.costExchangeRate} onChange={(e) => patchDraft({ costExchangeRate: e.target.value })} /></Field>
            <Field label="سعر شراء الوحدة"><input className={inputClass} type="number" min={0} value={draft.purchasePrice} onChange={(e) => patchDraft({ purchasePrice: e.target.value })} /></Field>
            <Field label="الشحن / وحدة (د.ع)"><input className={inputClass} type="number" min={0} value={draft.shippingCostIqd} onChange={(e) => patchDraft({ shippingCostIqd: e.target.value })} /></Field>
            <Field label="الجمارك / وحدة"><input className={inputClass} type="number" min={0} value={draft.customsCostIqd} onChange={(e) => patchDraft({ customsCostIqd: e.target.value })} /></Field>
            <Field label="التخليص / وحدة"><input className={inputClass} type="number" min={0} value={draft.brokerageCostIqd} onChange={(e) => patchDraft({ brokerageCostIqd: e.target.value })} /></Field>
            <Field label="المناولة / وحدة"><input className={inputClass} type="number" min={0} value={draft.handlingCostIqd} onChange={(e) => patchDraft({ handlingCostIqd: e.target.value })} /></Field>
            <Field label="تكاليف أخرى / وحدة"><input className={inputClass} type="number" min={0} value={draft.otherCostIqd} onChange={(e) => patchDraft({ otherCostIqd: e.target.value })} /></Field>
            <Field label="الحد الأدنى للهامش %"><input className={inputClass} type="number" min={0} max={100} value={draft.minMarginPct} onChange={(e) => patchDraft({ minMarginPct: e.target.value })} /></Field>
          </div>
          <div className={`mt-4 rounded-[12px] p-4 ${grossMargin !== null && grossMargin < Number(draft.minMarginPct) ? "bg-[var(--admin-danger-bg)] text-[var(--admin-danger)]" : "bg-[var(--admin-success-bg)] text-[var(--admin-success)]"}`}>
            <div className="flex justify-between text-[13px]"><span>التكلفة الواصلة</span><strong>{formatPrice(Math.round(landedCost))}</strong></div>
            <div className="mt-2 flex justify-between text-[13px]"><span>هامش الربح</span><strong>{grossMargin === null ? "غير متوفر" : `${grossMargin.toFixed(2)}%`}</strong></div>
          </div>
        </SectionCard>

        {/* Inventory */}
        <SectionCard title="المخزون">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="المخزون الحالي" error={errors.stock}>
              <input
                className={inputClass}
                dir="ltr"
                type="number"
                min={0}
                step={1}
                value={draft.stock}
                onChange={(e) => patchDraft({ stock: e.target.value })}
              />
            </Field>
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-[var(--admin-text-secondary)]">
                حالة المخزون
              </p>
              <div
                className={`flex h-10 items-center gap-2 rounded-[10px] px-3 text-[13px] font-medium ${
                  stockStatus === "ok"
                    ? "bg-[var(--admin-success-bg)] text-[var(--admin-success)]"
                    : stockStatus === "low"
                      ? "bg-[var(--admin-warning-bg)] text-[var(--admin-warning)]"
                      : "bg-[var(--admin-danger-bg)] text-[var(--admin-danger)]"
                }`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {stockStatus === "ok"
                  ? "متوفر"
                  : stockStatus === "low"
                    ? "مخزون منخفض"
                    : "نفد المخزون"}
              </div>
            </div>
            <Field label="الحد الأدنى للمخزون" hint="للتنبيه البصري فقط">
              <input
                className={`${inputClass} opacity-80`}
                dir="ltr"
                value="10"
                readOnly
                disabled
              />
            </Field>
            <Field label="تنبيه إعادة الطلب" hint="للتنبيه البصري فقط">
              <input
                className={`${inputClass} opacity-80`}
                dir="ltr"
                value="20"
                readOnly
                disabled
              />
            </Field>
          </div>
          <p className="mt-3 text-[12px] text-[var(--admin-text-muted)]">
            {Number(draft.stock) || 0} وحدة حالياً
          </p>
        </SectionCard>
      </div>

      {/* Description */}
      <div className="mt-5">
        <SectionCard
          title="وصف المنتج"
          action={
            <span className="text-[11px] text-[var(--admin-text-muted)]">
              {draft.descriptionAr.length}/2000
            </span>
          }
        >
          <div className="mb-2 flex flex-wrap gap-1">
            {[
              {
                label: "عريض",
                icon: Bold,
                onClick: () => wrapSelection("**", "**"),
              },
              {
                label: "مائل",
                icon: Italic,
                onClick: () => wrapSelection("_", "_"),
              },
              {
                label: "قائمة",
                icon: List,
                onClick: () =>
                  patchDraft({
                    descriptionAr:
                      draft.descriptionAr +
                      (draft.descriptionAr.endsWith("\n") || !draft.descriptionAr
                        ? "• "
                        : "\n• "),
                  }),
              },
              {
                label: "رابط",
                icon: Link2,
                onClick: () => wrapSelection("[", "](https://)"),
              },
              {
                label: "يمين",
                icon: AlignRight,
                onClick: () => setDescAlign("right"),
              },
              {
                label: "وسط",
                icon: AlignCenter,
                onClick: () => setDescAlign("center"),
              },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                title={btn.label}
                onClick={btn.onClick}
                className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-plum)]"
              >
                <btn.icon className="size-3.5" strokeWidth={1.7} />
              </button>
            ))}
          </div>
          <Field label="" error={errors.descriptionAr}>
            <textarea
              ref={descRef}
              rows={6}
              maxLength={2000}
              value={draft.descriptionAr}
              onChange={(e) => patchDraft({ descriptionAr: e.target.value })}
              style={{ textAlign: descAlign }}
                  className={`${modernTextareaClass} leading-7`}
                  placeholder="اكتبي وصفاً أنيقاً للمنتج…"
                />
              </Field>
              <div className="mt-3">
                <Field label="الوصف بالإنجليزية (اختياري)">
                  <textarea
                    rows={3}
                    dir="ltr"
                    maxLength={2000}
                    value={draft.description}
                    onChange={(e) => patchDraft({ description: e.target.value })}
                    className={modernTextareaClass}
                  />
                </Field>
              </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Tags */}
        <SectionCard title="مميزات المنتج">
          <div className="flex flex-wrap gap-2">
            {draft.benefitsAr.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-1.5 text-[12.5px] text-[var(--admin-text)]"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`حذف ${tag}`}
                  onClick={() =>
                    patchDraft({
                      benefitsAr: draft.benefitsAr.filter((t) => t !== tag),
                    })
                  }
                  className="text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)]"
                >
                  <X className="size-3.5" strokeWidth={1.8} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className={inputClass}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="ميزة جديدة…"
            />
            <button
              type="button"
              onClick={addTag}
              className="h-10 shrink-0 rounded-[10px] border border-[var(--admin-border)] bg-white px-3 text-[12.5px] font-medium text-[var(--admin-plum)]"
            >
              + إضافة ميزة
            </button>
          </div>
        </SectionCard>

        <SectionCard title="فلاتر الجمال (بحث)">
          <Field label="نوع المنتج (Product Type)">
            <input
              className={inputClass}
              value={draft.productType}
              onChange={(e) => patchDraft({ productType: e.target.value })}
              placeholder="serum · cleanser · moisturizer…"
              dir="ltr"
            />
          </Field>
          <div className="mt-4">
            <p className="mb-2 text-[12px] font-medium text-[var(--admin-text-muted)]">
              نوع البشرة
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["oily", "دهنية"],
                  ["dry", "جافة"],
                  ["combination", "مختلطة"],
                  ["normal", "عادية"],
                  ["sensitive", "حساسة"],
                ] as const
              ).map(([id, label]) => {
                const on = draft.skinTypes.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      patchDraft({
                        skinTypes: on
                          ? draft.skinTypes.filter((t) => t !== id)
                          : [...draft.skinTypes, id],
                      })
                    }
                    className={
                      on
                        ? "rounded-full bg-[var(--admin-plum)] px-3 py-1.5 text-[12px] text-white"
                        : "rounded-full border border-[var(--admin-border)] px-3 py-1.5 text-[12px] text-[var(--admin-text)]"
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-[12px] font-medium text-[var(--admin-text-muted)]">
              وسوم الميزات (Feature Tags)
            </p>
            <div className="flex flex-wrap gap-2">
              {draft.featureTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-1.5 text-[12.5px]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      patchDraft({
                        featureTags: draft.featureTags.filter((t) => t !== tag),
                      })
                    }
                    className="text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)]"
                  >
                    <X className="size-3.5" strokeWidth={1.8} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className={inputClass}
                id="feature-tag-input"
                placeholder="vegan · fragrance-free · k-beauty…"
                dir="ltr"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const el = e.currentTarget;
                  const v = el.value.trim().toLowerCase();
                  if (!v || draft.featureTags.includes(v)) return;
                  patchDraft({ featureTags: [...draft.featureTags, v] });
                  el.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(
                    "feature-tag-input",
                  ) as HTMLInputElement | null;
                  const v = el?.value.trim().toLowerCase();
                  if (!v || draft.featureTags.includes(v)) return;
                  patchDraft({ featureTags: [...draft.featureTags, v] });
                  if (el) el.value = "";
                }}
                className="h-10 shrink-0 rounded-[10px] border border-[var(--admin-border)] bg-white px-3 text-[12.5px] font-medium text-[var(--admin-plum)]"
              >
                + وسم
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Visibility */}
        <SectionCard title="إبراز المنتج">
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  key: "isActive",
                  label: "ظاهر في المتجر",
                  value: draft.isActive,
                  onToggle: () => patchDraft({ isActive: !draft.isActive }),
                },
                {
                  key: "isBestseller",
                  label: "الأكثر مبيعاً",
                  value: draft.isBestseller,
                  onToggle: () =>
                    patchDraft({ isBestseller: !draft.isBestseller }),
                },
                {
                  key: "isNew",
                  label: "منتج جديد",
                  value: draft.isNew,
                  onToggle: () => patchDraft({ isNew: !draft.isNew }),
                },
                {
                  key: "specialOffer",
                  label: "عرض خاص",
                  value: draft.specialOffer || draft.discountPercent > 0,
                  onToggle: () => {
                    const next = !(draft.specialOffer || draft.discountPercent > 0);
                    patchDraft({
                      specialOffer: next,
                      discountPercent: next
                        ? draft.discountPercent || 20
                        : 0,
                      customSale: next ? false : draft.customSale,
                    });
                  },
                },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onToggle}
                className={`rounded-[12px] border px-3.5 py-3 text-start transition ${
                  item.value
                    ? "border-[var(--admin-plum)]/25 bg-[var(--admin-plum)]/[0.06]"
                    : "border-[var(--admin-border)] bg-[var(--admin-surface-soft)]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex size-4 items-center justify-center rounded-[4px] border text-[10px] ${
                      item.value
                        ? "border-[var(--admin-plum)] bg-[var(--admin-plum)] text-white"
                        : "border-[var(--admin-border-strong)] bg-white"
                    }`}
                  >
                    {item.value ? "✓" : ""}
                  </span>
                  <span className="text-[13px] font-medium text-[var(--admin-text)]">
                    {item.label}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Variants soft entry */}
      <div className="mt-5">
        <SectionCard title="خيارات المنتج">
          <p className="text-[13px] text-[var(--admin-text-secondary)]">
            هذا المنتج لا يحتوي خيارات إضافية حالياً (حجم / لون / رائحة).
          </p>
          <button
            type="button"
            onClick={() =>
              toast.warning(
                "خيارات المنتج",
                "إضافة الخيارات المتعددة غير مفعّلة في النظام الحالي.",
              )
            }
            className="mt-3 inline-flex h-9 items-center rounded-[10px] border border-dashed border-[var(--admin-border-strong)] px-3.5 text-[12.5px] font-medium text-[var(--admin-plum)]"
          >
            + إضافة خيار
          </button>
        </SectionCard>
      </div>
        </div>

        <div className="hidden lg:sticky lg:top-4 lg:block">
          <PreviewCard
            imageUrl={product.imageUrl}
            titleAr={draft.nameAr}
            titleEn={draft.name}
            brand={draft.brandName}
            category={categoryLabel}
            priceLabel={formatPrice(previewSale)}
            stock={draft.stock || "0"}
            published={draft.isActive}
          />
        </div>
      </div>

      <StickyFormActions
        note={
          dirty ? "لديك تغييرات غير محفوظة" : "جميع التغييرات محفوظة"
        }
        right={
          <>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] border border-[var(--admin-border)] bg-white px-3 text-[13px] font-medium sm:flex-none"
            >
              <Eye className="size-3.5" strokeWidth={1.7} />
              معاينة
            </button>
            <button
              type="button"
              disabled={saving || !draft.isActive}
              onClick={() => patchDraft({ isActive: false })}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-[12px] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 text-[13px] font-medium text-[var(--admin-text-secondary)] disabled:opacity-40 sm:flex-none"
            >
              إخفاء
            </button>
            <button
              type="button"
              disabled={saving || !dirty}
              onClick={() => void saveAll()}
              className="inline-flex h-11 flex-[1.4] items-center justify-center rounded-[12px] bg-[var(--admin-plum)] px-4 text-[13px] font-medium text-white disabled:opacity-40 sm:flex-none sm:min-w-[9.5rem]"
            >
              {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
            </button>
          </>
        }
      />

      {/* Preview modal */}
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 sm:items-center sm:p-6">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[20px] bg-white shadow-[var(--admin-shadow-md)] sm:rounded-[20px]">
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3">
              <div className="flex gap-1 rounded-full bg-[var(--admin-surface-soft)] p-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`rounded-full px-3 py-1 text-[12px] ${
                    previewMode === "mobile"
                      ? "bg-white text-[var(--admin-plum)] shadow-sm"
                      : "text-[var(--admin-text-muted)]"
                  }`}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`rounded-full px-3 py-1 text-[12px] ${
                    previewMode === "desktop"
                      ? "bg-white text-[var(--admin-plum)] shadow-sm"
                      : "text-[var(--admin-text-muted)]"
                  }`}
                >
                  Desktop
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/shop/${product.slug}`}
                  target="_blank"
                  className="text-[12px] text-[var(--admin-plum)]"
                >
                  فتح في المتجر
                </Link>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="inline-flex size-8 items-center justify-center rounded-full hover:bg-[var(--admin-surface-soft)]"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto bg-[var(--admin-bg)] p-4 sm:p-6">
              <div
                className={`mx-auto overflow-hidden rounded-[16px] border border-[var(--admin-border)] bg-white ${
                  previewMode === "mobile" ? "max-w-[360px]" : "max-w-2xl"
                }`}
              >
                <div
                  className={`bg-[var(--admin-surface-soft)] ${
                    previewMode === "mobile" ? "aspect-[4/5]" : "aspect-[16/10]"
                  }`}
                >
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={draft.nameAr}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[13px] text-[var(--admin-text-muted)]">
                      بدون صورة
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">
                    {categoryLabel}
                  </p>
                  <h3 className="font-display text-[1.25rem] font-semibold text-[var(--admin-plum)]">
                    {draft.nameAr}
                  </h3>
                  <p className="text-[13px] text-[var(--admin-text-secondary)]" dir="ltr">
                    {draft.name} · {draft.size}
                  </p>
                  <p className="text-[15px] font-medium text-[var(--admin-text)]">
                    {formatPrice(previewSale)}
                  </p>
                  <p className="whitespace-pre-wrap text-[13px] leading-7 text-[var(--admin-text-secondary)]">
                    {draft.descriptionAr}
                  </p>
                  {draft.benefitsAr.length ? (
                    <ul className="flex flex-wrap gap-1.5 pt-1">
                      {draft.benefitsAr.map((b) => (
                        <li
                          key={b}
                          className="rounded-full bg-[var(--admin-surface-soft)] px-2.5 py-1 text-[11px] text-[var(--admin-text-secondary)]"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Leave modal */}
      {leaveOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-white p-5 shadow-[var(--admin-shadow-md)]">
            <h3 className="text-[16px] font-semibold text-[var(--admin-text)]">
              لديك تغييرات غير محفوظة
            </h3>
            <p className="mt-2 text-[13px] leading-6 text-[var(--admin-text-secondary)]">
              هل تريد مغادرة الصفحة دون حفظ؟
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setLeaveOpen(false);
                  setPendingHref(null);
                }}
                className="h-10 flex-1 rounded-[10px] border border-[var(--admin-border)] text-[13px] font-medium"
              >
                البقاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const href = pendingHref || "/admin/products";
                  setLeaveOpen(false);
                  setPendingHref(null);
                  setDraft(draftFromProduct(product));
                  router.push(href);
                }}
                className="h-10 flex-1 rounded-[10px] bg-[var(--admin-plum)] text-[13px] font-medium text-white"
              >
                مغادرة دون حفظ
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete modal */}
      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-white p-5 shadow-[var(--admin-shadow-md)]">
            <h3 className="text-[16px] font-semibold text-[var(--admin-text)]">
              هل أنت متأكد من حذف هذا المنتج؟
            </h3>
            <p className="mt-2 text-[13px] leading-6 text-[var(--admin-text-secondary)]">
              لا يمكن التراجع عن هذا الإجراء. سيُحذف المنتج من الكتالوج والمتجر.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="h-10 flex-1 rounded-[10px] border border-[var(--admin-border)] text-[13px] font-medium"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void deleteProduct()}
                className="h-10 flex-1 rounded-[10px] bg-[var(--admin-danger)] text-[13px] font-medium text-white disabled:opacity-40"
              >
                حذف المنتج
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
