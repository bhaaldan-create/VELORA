"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { modernInputClass } from "@/components/admin/product-form/primitives";

/** Chip editor for newline/comma-backed string lists (create form). */
export function StringListEditor({
  value,
  onChange,
  placeholder,
  dir,
  addLabel = "إضافة",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  addLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const items = value
    .split(/[\n,،]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  function commit(next: string[]) {
    onChange(next.join("\n"));
  }

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (items.includes(v)) {
      setDraft("");
      return;
    }
    commit([...items, v]);
    setDraft("");
  }

  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 rounded-[12px] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-2.5"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-[var(--admin-plum)]/50" />
              <span className="min-w-0 flex-1 text-[13.5px] text-[var(--admin-text)]" dir={dir}>
                {item}
              </span>
              <button
                type="button"
                aria-label={`حذف ${item}`}
                onClick={() => commit(items.filter((x) => x !== item))}
                className="text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)]"
              >
                <X className="size-3.5" strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <input
          className={modernInputClass}
          value={draft}
          dir={dir}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[13px] border border-[var(--admin-border)] bg-white px-3.5 text-[12.5px] font-medium text-[var(--admin-plum)] transition hover:border-[var(--admin-plum-soft)]"
        >
          <Plus className="size-3.5" strokeWidth={1.8} />
          {addLabel}
        </button>
      </div>
    </div>
  );
}

export function ChipMultiSelect<T extends string>({
  options,
  value,
  onToggle,
}: {
  options: { id: T; label: string }[];
  value: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={
              on
                ? "rounded-full bg-[var(--admin-plum)] px-3.5 py-2 text-[12.5px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] transition"
                : "rounded-full border border-[var(--admin-border)] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[var(--admin-text-secondary)] transition hover:border-[var(--admin-plum-soft)]"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
