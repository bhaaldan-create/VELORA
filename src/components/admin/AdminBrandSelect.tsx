"use client";

import { useMemo, useState } from "react";
import { shopBrands } from "@/data/shop-brands";

type Props = {
  value: string;
  onChange: (brandName: string) => void;
  required?: boolean;
  id?: string;
  className?: string;
};

/**
 * Brand select from the same shopBrands source used by Search/Filters (39 brands).
 * Stores Product.brandName as the official English brand name (single source of truth).
 */
export function AdminBrandSelect({
  value,
  onChange,
  required,
  id,
  className,
}: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return shopBrands;
    return shopBrands.filter(
      (b) =>
        b.name.toLowerCase().includes(needle) ||
        b.nameAr.includes(q.trim()) ||
        b.slug.includes(needle) ||
        b.match.some((m) => m.includes(needle)),
    );
  }, [q]);

  const known = shopBrands.some((b) => b.name === value);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحثي عن براند…"
        className="h-9 w-full rounded-[10px] border border-[var(--admin-border)] bg-white px-3 text-[13px] text-[var(--admin-text)] outline-none focus:border-[var(--admin-plum-soft)]"
        dir="rtl"
      />
      <select
        id={id}
        required={required}
        value={known ? value : value ? "__custom__" : ""}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "" || next === "__custom__") {
            onChange("");
            return;
          }
          onChange(next);
        }}
        className={
          className ||
          "h-11 w-full rounded-[12px] border border-[var(--admin-border)] bg-white px-3 text-[14px] text-[var(--admin-text)] outline-none focus:border-[var(--admin-plum-soft)]"
        }
        dir="ltr"
      >
        <option value="">— اختاري براند —</option>
        {filtered.map((b) => (
          <option key={b.id} value={b.name}>
            {b.name} — {b.nameAr}
          </option>
        ))}
        {value && !known ? (
          <option value="__custom__" disabled>
            {value} (غير مدرج — اختاري من القائمة)
          </option>
        ) : null}
      </select>
      <p className="text-[11.5px] text-[var(--admin-text-muted)]">
        القائمة من براندات المتجر الرسمية ({shopBrands.length}) — نفس مصدر البحث
        والفلاتر.
      </p>
    </div>
  );
}
