"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { shopBrands } from "@/data/shop-brands";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (brandName: string) => void;
  required?: boolean;
  id?: string;
};

/**
 * Premium searchable brand combobox.
 * Source of truth: shopBrands (same as storefront search/filters).
 */
export function BrandCombobox({ value, onChange, required, id }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const selected = shopBrands.find((b) => b.name === value) ?? null;

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

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(name: string) {
    onChange(name);
    setQ("");
    setOpen(false);
    setActive(0);
  }

  function clear() {
    onChange("");
    setQ("");
    setOpen(false);
    setActive(0);
  }

  return (
    <div ref={rootRef} className="relative" id={id}>
      <div
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-[13px] border bg-white px-3 transition duration-200",
          open
            ? "border-[var(--admin-plum-soft)] ring-[3px] ring-[var(--admin-plum)]/8"
            : "border-[var(--admin-border)]",
        )}
      >
        <Search
          className="size-4 shrink-0 text-[var(--admin-text-muted)]"
          strokeWidth={1.6}
        />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-required={required}
          value={open ? q : selected ? selected.name : value || q}
          placeholder="ابحثي عن براند…"
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
            if (value) onChange("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const hit = filtered[active];
              if (hit) pick(hit.name);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-10 min-w-0 flex-1 bg-transparent text-[14px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-muted)]"
          dir="ltr"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex size-7 items-center justify-center rounded-full text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
            aria-label="مسح البراند"
          >
            <X className="size-3.5" strokeWidth={1.7} />
          </button>
        ) : (
          <ChevronsUpDown
            className="size-4 text-[var(--admin-text-muted)]"
            strokeWidth={1.6}
          />
        )}
      </div>

      {selected ? (
        <div className="mt-2 flex items-center gap-2.5 rounded-[12px] bg-[var(--admin-surface-soft)] px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.logo}
            alt=""
            className="size-7 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[var(--admin-text)]" dir="ltr">
              {selected.name}
            </p>
            <p className="truncate text-[11.5px] text-[var(--admin-text-muted)]">
              {selected.nameAr}
            </p>
          </div>
          <Check className="size-4 text-[var(--admin-plum)]" strokeWidth={1.8} />
        </div>
      ) : null}

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-[14px] border border-[var(--admin-border)] bg-white py-1.5 shadow-[var(--admin-shadow-md)]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-[13px] text-[var(--admin-text-muted)]">
              لا توجد براندات مطابقة
            </li>
          ) : (
            filtered.map((b, i) => {
              const on = b.name === value;
              return (
                <li key={b.id} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(b.name)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-start transition",
                      i === active || on
                        ? "bg-[var(--admin-plum)]/[0.06]"
                        : "hover:bg-[var(--admin-surface-soft)]",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.logo}
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-medium text-[var(--admin-text)]"
                        dir="ltr"
                      >
                        {b.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-[var(--admin-text-muted)]">
                        {b.nameAr}
                      </span>
                    </span>
                    {on ? (
                      <Check
                        className="size-4 text-[var(--admin-plum)]"
                        strokeWidth={1.8}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      <p className="mt-1.5 text-[11.5px] text-[var(--admin-text-muted)]">
        {shopBrands.length} براند رسمي — نفس مصدر البحث والفلاتر في المتجر
      </p>
    </div>
  );
}
