"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { AdminNavIcon, Search, X } from "@/components/admin/ui/icons";

type Command = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  keywords?: string;
};

const STATIC_COMMANDS: Command[] = [
  ...ADMIN_NAV.map((n) => ({
    id: `nav-${n.id}`,
    label: n.labelAr,
    hint: n.labelEn,
    href: n.href,
    keywords: `${n.labelAr} ${n.labelEn} ${n.id}`,
  })),
  {
    id: "ai-ask",
    label: "اسألي وكيل الأعمال",
    hint: "AI Agent",
    href: "/admin/ai",
    keywords: "ai ذكي سؤال ربح مبيعات مخزون",
  },
  {
    id: "create-product",
    label: "إضافة منتج",
    hint: "Products",
    href: "/admin/products#create",
    keywords: "منتج جديد add product",
  },
  {
    id: "audit-log",
    label: "سجل التدقيق",
    hint: "Audit",
    href: "/admin/settings/audit",
    keywords: "audit سجل تدقيق تغييرات",
  },
  {
    id: "store",
    label: "فتح المتجر",
    hint: "Storefront",
    href: "/",
    keywords: "store متجر",
  },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return STATIC_COMMANDS.slice(0, 12);
    return STATIC_COMMANDS.filter((c) =>
      `${c.label} ${c.hint || ""} ${c.keywords || ""}`
        .toLowerCase()
        .includes(needle),
    ).slice(0, 12);
  }, [q]);

  if (!open) return null;

  function run(cmd: Command) {
    if (cmd.href) {
      router.push(cmd.href);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(44,35,48,0.35)] backdrop-blur-[2px]"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-[12vh] w-[min(100%-1.25rem,32rem)] overflow-hidden rounded-[12px] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-md)] admin-animate-in">
        <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3.5">
          <Search
            className="size-4 text-[var(--admin-text-muted)]"
            strokeWidth={1.6}
          />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحثي عن طلب، عميلة، منتج، أو أمر…"
            className="h-12 w-full bg-transparent text-[14px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-muted)]"
            dir="rtl"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
            aria-label="إغلاق"
          >
            <X className="size-4" strokeWidth={1.6} />
          </button>
        </div>
        <ul className="max-h-[min(50vh,20rem)] overflow-y-auto admin-scroll p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-[13px] text-[var(--admin-text-muted)]">
              لا نتائج
            </li>
          ) : (
            results.map((cmd) => {
              const nav = ADMIN_NAV.find((n) => `nav-${n.id}` === cmd.id);
              return (
                <li key={cmd.id}>
                  <button
                    type="button"
                    onClick={() => run(cmd)}
                    className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-right transition hover:bg-[var(--admin-surface-soft)]"
                  >
                    {nav ? (
                      <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--admin-surface-soft)] text-[var(--admin-plum-soft)]">
                        <AdminNavIcon id={nav.id} />
                      </span>
                    ) : (
                      <span className="size-8" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-[var(--admin-text)]">
                        {cmd.label}
                      </span>
                      {cmd.hint ? (
                        <span className="block text-[11px] text-[var(--admin-text-muted)]">
                          {cmd.hint}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-3.5 py-2 text-[11px] text-[var(--admin-text-muted)]">
          <span>Ctrl / ⌘ + K</span>
          <span>Enter للتنفيذ · Esc للإغلاق</span>
        </div>
      </div>
    </div>
  );
}
