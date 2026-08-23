"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Check, X } from "@/components/admin/ui/icons";

type ToastTone = "success" | "warning" | "danger" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastApi = {
  push: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const Ctx = createContext<ToastApi | null>(null);

export function useAdminToast() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      push: () => {},
      success: () => {},
      warning: () => {},
      error: () => {},
    } satisfies ToastApi;
  }
  return ctx;
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [...prev.slice(-4), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, description) =>
        push({ title, description, tone: "success" }),
      warning: (title, description) =>
        push({ title, description, tone: "warning" }),
      error: (title, description) =>
        push({ title, description, tone: "danger" }),
    }),
    [push],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed bottom-20 left-1/2 z-[80] flex w-[min(100%-1.5rem,22rem)] -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 py-3 shadow-[var(--admin-shadow-md)] admin-animate-in ${
              t.tone === "success"
                ? "border-[var(--admin-success)]/20"
                : t.tone === "danger"
                  ? "border-[var(--admin-danger)]/25"
                  : t.tone === "warning"
                    ? "border-[var(--admin-warning)]/25"
                    : ""
            }`}
          >
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                t.tone === "success"
                  ? "bg-[var(--admin-success-bg)] text-[var(--admin-success)]"
                  : t.tone === "danger"
                    ? "bg-[var(--admin-danger-bg)] text-[var(--admin-danger)]"
                    : t.tone === "warning"
                      ? "bg-[var(--admin-warning-bg)] text-[var(--admin-warning)]"
                      : "bg-[var(--admin-info-bg)] text-[var(--admin-info)]"
              }`}
            >
              {t.tone === "danger" ? (
                <X className="size-3" strokeWidth={2.2} />
              ) : (
                <Check className="size-3" strokeWidth={2.2} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[var(--admin-text)]">
                {t.title}
              </p>
              {t.description ? (
                <p className="mt-0.5 text-[12px] text-[var(--admin-text-secondary)]">
                  {t.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
              onClick={() => dismiss(t.id)}
              aria-label="إغلاق"
            >
              <X className="size-3.5" strokeWidth={1.8} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
