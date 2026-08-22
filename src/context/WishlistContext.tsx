"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

type ToastState = { id: number; message: string } | null;

type WishlistContextValue = {
  ids: Set<string>;
  count: number;
  toggle: (productId: string) => Promise<boolean>;
  has: (productId: string) => boolean;
  ready: boolean;
  toast: ToastState;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { customer, loading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number | null>(null);
  const customerId = customer?.id ?? null;

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    const id = Date.now();
    setToast({ id, message });
    toastTimer.current = window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!customerId) {
      setIds(new Set());
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    void (async () => {
      try {
        const res = await fetch("/api/auth/wishlist", { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          ids?: string[];
        };
        if (cancelled) return;
        if (res.ok && data.ok && Array.isArray(data.ids)) {
          setIds(new Set(data.ids));
        } else {
          setIds(new Set());
        }
      } catch {
        if (!cancelled) setIds(new Set());
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, customerId]);

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!customerId) {
        const next = encodeURIComponent(pathname || "/account");
        router.push(`/login?next=${next}`);
        return false;
      }

      const wasWished = ids.has(productId);
      const optimistic = new Set(ids);
      if (wasWished) optimistic.delete(productId);
      else optimistic.add(productId);
      setIds(optimistic);

      try {
        const res = await fetch("/api/auth/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          wished?: boolean;
          error?: string;
          message?: string;
        };

        if (!res.ok || !data.ok) {
          setIds(ids);
          if (res.status === 401) {
            const next = encodeURIComponent(pathname || "/account");
            router.push(`/login?next=${next}`);
          }
          return false;
        }

        setIds((prev) => {
          const next = new Set(prev);
          if (data.wished) next.add(productId);
          else next.delete(productId);
          return next;
        });

        showToast(
          data.message ||
            (data.wished
              ? "تمت إضافة المنتج إلى محفوظاتك."
              : "تمت إزالة المنتج من محفوظاتك."),
        );
        return true;
      } catch {
        setIds(ids);
        return false;
      }
    },
    [customerId, ids, pathname, router, showToast],
  );

  const value = useMemo(
    () => ({
      ids,
      count: ids.size,
      toggle,
      has,
      ready,
      toast,
    }),
    [ids, toggle, has, ready, toast],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 sm:bottom-8"
        >
          <p className="animate-[velora-rise_0.35s_ease-out_both] rounded-full border border-[var(--plum)]/12 bg-[var(--ivory)]/95 px-5 py-2.5 text-center text-[0.85rem] text-[var(--plum)] shadow-[0_12px_40px_rgba(58,24,54,0.08)] backdrop-blur-md">
            {toast.message}
          </p>
        </div>
      ) : null}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
