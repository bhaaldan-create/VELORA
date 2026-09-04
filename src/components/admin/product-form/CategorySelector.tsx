"use client";

import type { CategorySlug } from "@/types";
import { Droplets, Flower2, Sparkles, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

export const PRODUCT_CATEGORIES: {
  slug: CategorySlug;
  label: string;
  hint: string;
  icon: typeof Sparkles;
}[] = [
  {
    slug: "skincare",
    label: "العناية بالبشرة",
    hint: "سيروم · مرطب · واقي شمس",
    icon: Droplets,
  },
  {
    slug: "makeup",
    label: "المكياج",
    hint: "أساس · ماسكارا · أحمر",
    icon: Sparkles,
  },
  {
    slug: "hair-care",
    label: "العناية بالشعر",
    hint: "شامبو · ماسك · سيروم",
    icon: Wind,
  },
  {
    slug: "body-care",
    label: "العناية بالجسم",
    hint: "لوشن · زيت · مقشر",
    icon: Flower2,
  },
];

export function CategorySelector({
  value,
  onChange,
}: {
  value: CategorySlug | string;
  onChange: (slug: CategorySlug) => void;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {PRODUCT_CATEGORIES.map((c) => {
        const on = value === c.slug;
        const Icon = c.icon;
        return (
          <button
            key={c.slug}
            type="button"
            onClick={() => onChange(c.slug)}
            className={cn(
              "rounded-[14px] border px-3.5 py-3.5 text-start transition duration-200",
              on
                ? "border-[var(--admin-plum)]/30 bg-[var(--admin-plum)]/[0.06] shadow-[inset_0_0_0_1px_rgba(52,34,57,0.08)]"
                : "border-[var(--admin-border)] bg-white hover:border-[var(--admin-plum-soft)]",
            )}
          >
            <span className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-[11px]",
                  on
                    ? "bg-[var(--admin-plum)] text-white"
                    : "bg-[var(--admin-surface-soft)] text-[var(--admin-plum)]",
                )}
              >
                <Icon className="size-4" strokeWidth={1.6} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-[var(--admin-text)]">
                  {c.label}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-[var(--admin-text-muted)]">
                  {c.hint}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
