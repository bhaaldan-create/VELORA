"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { IconInstagram, IconWhatsApp } from "@/components/contact/SocialIcons";
import { useCheckoutUI } from "@/context/CheckoutUIContext";
import { useLocale } from "@/context/LocaleContext";
import {
  getDefaultWhatsAppUrl,
  getInstagramUrl,
  socialLinks,
} from "@/lib/social-links";
import { cn } from "@/lib/utils";
import { isAuthRoute } from "@/components/auth/auth-utils";

export function FloatingContact() {
  const pathname = usePathname();
  if (isAuthRoute(pathname)) return null;
  const { locale } = useLocale();
  const ar = locale !== "en";
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const waUrl = getDefaultWhatsAppUrl(ar ? "ar" : "en");
  const igUrl = getInstagramUrl();

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const { immersive } = useCheckoutUI();

  if (pathname.startsWith("/admin")) return null;
  if (immersive) return null;
  if (!waUrl && !igUrl) return null;

  const isCartPage = pathname === "/cart";
  const isCheckoutPage = pathname === "/checkout";
  const isProductPage = pathname.startsWith("/shop/") && pathname !== "/shop";
  const bottomOffset = isCartPage || isCheckoutPage
    ? "calc(7.5rem + env(safe-area-inset-bottom))"
    : isProductPage
      ? "calc(5.75rem + var(--pdp-sticky-offset, 0px) + env(safe-area-inset-bottom))"
      : "calc(4.75rem + env(safe-area-inset-bottom))";

  return (
    <div
      ref={rootRef}
      style={{ bottom: bottomOffset }}
      className={cn(
        "fixed z-[60] flex flex-col items-end gap-2.5",
        "end-3.5 lg:end-6 lg:bottom-8",
        "transition-[opacity,transform] duration-500 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <div
        id={panelId}
        role="dialog"
        aria-label={ar ? "تواصلي مع VELORA" : "Contact VELORA"}
        aria-hidden={!open}
        className={cn(
          "w-[min(18.5rem,calc(100vw-2rem))] origin-bottom overflow-hidden rounded-[22px]",
          "border border-[var(--plum)]/12 bg-[var(--ivory)]/95 shadow-[0_18px_50px_rgba(58,24,54,0.12)] backdrop-blur-md",
          "transition-all duration-300 ease-out",
          open
            ? "pointer-events-auto max-h-[28rem] scale-100 opacity-100"
            : "pointer-events-none max-h-0 scale-95 opacity-0",
        )}
      >
        <div className="p-4 pt-5">
          <p className="font-display text-[1.05rem] font-semibold text-[var(--plum)]">
            {ar ? "تواصلي مع VELORA" : "Contact VELORA"}
          </p>
          <p className="mt-1 text-[0.85rem] text-[var(--muted)]">
            {ar ? "نحن هنا لمساعدتكِ 🤍" : "We’re here for you 🤍"}
          </p>

          <div className="mt-4 space-y-2">
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-[var(--plum)]/10 bg-white/70 px-3.5 py-3 transition-colors hover:border-[var(--plum)]/25 hover:bg-white"
                onClick={() => setOpen(false)}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mist)] text-[#3d8b6e]">
                  <IconWhatsApp size={18} />
                </span>
                <span className="min-w-0 text-start">
                  <span className="block text-[0.9rem] font-medium text-[var(--plum)]">
                    WhatsApp
                  </span>
                  <span className="block text-[0.75rem] text-[var(--muted)]">
                    {ar
                      ? "للطلب والاستفسارات"
                      : "Orders & questions"}
                  </span>
                </span>
              </a>
            ) : null}

            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-[var(--plum)]/10 bg-white/70 px-3.5 py-3 transition-colors hover:border-[var(--plum)]/25 hover:bg-white"
              onClick={() => setOpen(false)}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mist)] text-[var(--plum)]">
                <IconInstagram size={17} />
              </span>
              <span className="min-w-0 text-start">
                <span className="block text-[0.9rem] font-medium text-[var(--plum)]">
                  Instagram
                </span>
                <span className="block text-[0.75rem] text-[var(--muted)]">
                  {ar
                    ? "للتواصل واكتشاف جديد VELORA"
                    : "Follow & discover what’s new"}
                </span>
                <span
                  className="mt-0.5 block font-latin text-[0.7rem] tracking-[0.04em] text-[var(--plum)]/70"
                  dir="ltr"
                >
                  {socialLinks.instagram.handle}
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          open
            ? ar
              ? "إغلاق قائمة التواصل"
              : "Close contact menu"
            : ar
              ? "فتح تواصل VELORA"
              : "Open VELORA contact"
        }
        title={ar ? "تواصلي معنا" : "Contact us"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex h-11 w-11 items-center justify-center rounded-full",
          "border border-[var(--plum)]/12 bg-[var(--plum)] text-[var(--btn-fg)]",
          "shadow-[0_10px_28px_rgba(50,22,47,0.18)]",
          "transition-transform duration-250 ease-out",
          "hover:scale-[1.04] active:scale-[0.95]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--plum)]",
        )}
      >
        <IconWhatsApp
          size={17}
          className="text-[#a8d9c0] transition-transform duration-250 group-active:scale-90"
        />
      </button>
    </div>
  );
}
