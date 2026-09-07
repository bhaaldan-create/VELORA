"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";

type Brand = {
  id: string;
  name: string;
  slug: string;
  countryOfOrigin: string;
  officialWebsite: string;
  sourceCountry: string;
  notes: string;
  supplier: { id: string; name: string } | null;
};

type StorefrontBrand = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  country: string;
  countryAr: string;
  countryCode: string;
  logo: string;
  profileId: string | null;
};

export function BrandsAdmin() {
  const toast = useAdminToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [storefront, setStorefront] = useState<StorefrontBrand[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch("/api/admin/brands");
    const json = await res.json();
    if (json.ok) {
      setBrands(json.brands);
      setSuppliers(json.suppliers);
      setStorefront(json.storefront ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredStorefront = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return storefront;
    return storefront.filter(
      (b) =>
        b.name.toLowerCase().includes(needle) ||
        b.nameAr.includes(q.trim()) ||
        b.slug.includes(needle) ||
        b.countryAr.includes(q.trim()) ||
        b.country.toLowerCase().includes(needle),
    );
  }, [q, storefront]);

  async function syncShopBrands() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-shop" }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || "فشلت المزامنة");
        return;
      }
      toast.success(
        `تمت مزامنة براندات المتجر · جديد ${json.created} · محدّث ${json.updated}`,
      );
      await load();
    } finally {
      setSyncing(false);
    }
  }

  async function create() {
    const res = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        officialWebsite: website,
        countryOfOrigin: country,
        supplierId: supplierId || null,
        notes,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      toast.error(json.error || "فشل");
      return;
    }
    toast.success("تمت إضافة العلامة");
    setName("");
    setWebsite("");
    setCountry("");
    setNotes("");
    void load();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="ذكاء العلامات"
        description="براندات المتجر الرسمية (بحث/فلاتر) + ملفات الموردين والربحية."
      />

      <Surface className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--admin-text)]">
              براندات المتجر الرسمية
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--admin-text-muted)]">
              {storefront.length} براند — نفس مصدر البحث والفلاتر وCombobox
              المنتجات
            </p>
          </div>
          <button
            type="button"
            disabled={syncing}
            onClick={() => void syncShopBrands()}
            className="rounded-full bg-[var(--admin-plum)] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
          >
            {syncing ? "جاري المزامنة…" : "مزامنة إلى ملفات العلامات"}
          </button>
        </div>

        <input
          className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]"
          placeholder="ابحثي في براندات المتجر… (مثال: Fenty)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          dir="rtl"
        />

        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStorefront.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-[14px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.logo}
                alt=""
                className="size-10 shrink-0 rounded-[10px] object-contain ring-1 ring-[var(--admin-border)]"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[13px] font-medium text-[var(--admin-text)]"
                  dir="ltr"
                >
                  {b.name}
                </p>
                <p className="truncate text-[11px] text-[var(--admin-text-muted)]">
                  {b.nameAr} · {b.countryAr}
                </p>
              </div>
              <span
                className={
                  b.profileId
                    ? "shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                    : "shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                }
              >
                {b.profileId ? "مزامَن" : "متجر فقط"}
              </span>
            </li>
          ))}
        </ul>
      </Surface>

      <Surface className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <p className="sm:col-span-2 lg:col-span-3 text-[13px] font-medium text-[var(--admin-text)]">
          إضافة ملف علامة يدوياً
        </p>
        <input
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]"
          placeholder="اسم العلامة"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]"
          placeholder="الموقع الرسمي"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          dir="ltr"
        />
        <input
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]"
          placeholder="بلد المنشأ"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <select
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <option value="">المورد</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px] sm:col-span-2"
          placeholder="ملاحظات"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void create()}
          className="rounded-full bg-[var(--admin-accent)] px-4 py-2 text-[12px] text-white"
        >
          حفظ
        </button>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="border-b border-[var(--admin-border)] px-4 py-3">
          <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
            ملفات العلامات ({brands.length})
          </h2>
        </div>
        <ul className="divide-y divide-[var(--admin-border)]">
          {brands.map((b) => (
            <li key={b.id} className="px-4 py-3">
              <p className="font-medium">{b.name}</p>
              <p className="text-[11px] text-[var(--admin-text-muted)]">
                {b.countryOfOrigin || "—"} · مورد:{" "}
                {b.supplier?.name || "غير محدد"}
              </p>
              {b.officialWebsite ? (
                <a
                  href={b.officialWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[var(--admin-accent)]"
                  dir="ltr"
                >
                  {b.officialWebsite}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
