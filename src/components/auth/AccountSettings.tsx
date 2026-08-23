"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { useCart } from "@/context/CartContext";
import {
  useCustomerAuth,
  type CustomerPublic,
} from "@/context/CustomerAuthContext";
import { useLocale } from "@/context/LocaleContext";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatIraqMobileLocal } from "@/lib/phone";
import { getProductBrand } from "@/lib/product-brand";
import { cn, formatPrice } from "@/lib/utils";
import type { CategorySlug, Product } from "@/types";

type AccountSection =
  | "overview"
  | "wishlist"
  | "orders"
  | "addresses"
  | "profile"
  | "larsa"
  | "settings";

type OrderRow = {
  orderId: string;
  savedAt: string;
  status: string;
  statusLabel: string;
  totalLabel: string;
  itemCount: number;
  paymentMethodLabel: string;
  items?: { name: string; nameAr: string; quantity: number; price: number }[];
};

type WishProduct = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  imageUrl?: string | null;
  imageTone: string;
  size: string;
  category: string;
  stock?: number;
  inStock?: boolean;
};

const NAV: { id: AccountSection; ar: string; en: string }[] = [
  { id: "overview", ar: "نظرة عامة", en: "Overview" },
  { id: "wishlist", ar: "محفوظاتي", en: "Saved" },
  { id: "orders", ar: "طلباتي", en: "Orders" },
  { id: "addresses", ar: "عناويني", en: "Addresses" },
  { id: "profile", ar: "معلوماتي", en: "Profile" },
  { id: "larsa", ar: "لارسا", en: "LARSA" },
  { id: "settings", ar: "الإعدادات", en: "Settings" },
];

function isSection(v: string | null): v is AccountSection {
  return NAV.some((s) => s.id === v);
}

function firstName(full: string, ar: boolean) {
  const t = full.trim();
  if (!t) return ar ? "عزيزتي" : "there";
  return t.split(/\s+/)[0] ?? t;
}

function progressIndex(status: string) {
  if (status === "delivered") return 3;
  if (
    status === "handed_to_courier" ||
    status === "in_transit" ||
    status === "out_for_delivery"
  ) {
    return 2;
  }
  if (
    status === "preparing" ||
    status === "confirmed" ||
    status === "ready_to_ship"
  ) {
    return 1;
  }
  return 0;
}

const TIMELINE_AR = ["تم الطلب", "قيد التجهيز", "في الطريق", "تم التسليم"];
const TIMELINE_EN = ["Placed", "Preparing", "On the way", "Delivered"];

export function AccountSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer, loading, setCustomer, logout } = useCustomerAuth();
  const { theme, setTheme } = useTheme();
  const { locale } = useLocale();
  const { ids: wishIds, count: wishCount, toggle, ready: wishReady } = useWishlist();
  const { addItem } = useCart();
  const ar = locale !== "en";

  const section = useMemo<AccountSection>(() => {
    const q = searchParams.get("section");
    return isSection(q) ? q : "overview";
  }, [searchParams]);

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [myOrders, setMyOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [wishProducts, setWishProducts] = useState<WishProduct[]>([]);

  useEffect(() => {
    if (!loading && !customer) {
      router.replace("/login?next=/account");
    }
  }, [loading, customer, router]);

  useEffect(() => {
    if (!customer) return;
    setFullName(customer.fullName);
    setAddress(customer.address);
  }, [customer]);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(null);
    void (async () => {
      try {
        const res = await fetch("/api/auth/orders", { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          orders?: OrderRow[];
        };
        if (!res.ok || !data.ok) throw new Error(data.error || "تعذّر جلب الطلبات.");
        if (!cancelled) setMyOrders(data.orders || []);
      } catch (err) {
        if (!cancelled) {
          setOrdersError(err instanceof Error ? err.message : "تعذّر جلب الطلبات.");
        }
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customer]);

  useEffect(() => {
    if (!wishReady || !customer) return;
    if (!wishIds.size) {
      setWishProducts([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/wishlist", { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          products?: WishProduct[];
        };
        if (!cancelled && data.ok) setWishProducts(data.products || []);
      } catch {
        if (!cancelled) setWishProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wishIds, wishReady, customer, wishCount]);

  function goTo(next: AccountSection) {
    if (next === "larsa") {
      router.push("/advisor");
      return;
    }
    router.replace(next === "overview" ? "/account" : `/account?section=${next}`);
  }

  if (loading || !customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[0.9rem] text-[var(--account-muted)]">
          {ar ? "جارٍ تحميل مساحتكِ…" : "Loading your space…"}
        </p>
      </div>
    );
  }

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, address }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok || !data.ok || !data.customer) {
        throw new Error(data.error || (ar ? "تعذّر الحفظ." : "Could not save."));
      }
      setCustomer(data.customer);
      setProfileMessage(ar ? "تم حفظ معلوماتكِ." : "Your details were saved.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSavePassword(e: FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setSecurityError(null);
    setSecurityMessage(null);
    if (newPassword !== confirmPassword) {
      setSecurityError(ar ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.");
      setSavingPassword(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || (ar ? "تعذّر التغيير." : "Could not update."));
      }
      setSecurityMessage(ar ? "تم تحديث كلمة المرور." : "Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  const name = firstName(customer.fullName, ar);
  const latest = myOrders[0] ?? null;
  const inTransit = myOrders.filter((o) => o.status !== "delivered").length;
  const timeline = ar ? TIMELINE_AR : TIMELINE_EN;

  function toProduct(p: WishProduct): Product {
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      nameAr: p.nameAr,
      category: p.category as CategorySlug,
      price: p.price,
      originalPrice: p.originalPrice,
      discountPercent: p.discountPercent,
      currency: "IQD",
      description: "",
      descriptionAr: "",
      benefits: [],
      benefitsAr: [],
      ingredients: [],
      concerns: [],
      size: p.size,
      rating: 0,
      reviews: 0,
      imageTone: p.imageTone,
      imageUrl: p.imageUrl,
    };
  }

  return (
    <div className="account-shell" dir={ar ? "rtl" : "ltr"}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:gap-10">
        {/* Sidebar */}
        <aside className="shrink-0 lg:w-[240px]">
          <div className="rounded-[22px] border border-[var(--account-border)] bg-white/90 p-6 lg:sticky lg:top-24">
            <p className="font-latin text-[1.35rem] font-semibold leading-none tracking-tight text-[var(--account-plum)]">
              My
              <br />
              <span className="font-brand tracking-[0.18em]">VELORA</span>
            </p>
            <p className="mt-3 text-[0.8rem] leading-relaxed text-[var(--account-muted)]">
              {ar ? "مساحتك الخاصة في VELORA." : "Your private space in VELORA."}
            </p>

            <nav className="mt-8 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {NAV.map((item) => {
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.id)}
                    className={cn(
                      "shrink-0 rounded-2xl px-4 py-2.5 text-start text-[0.9rem] transition-colors duration-200",
                      active
                        ? "bg-[var(--account-lilac)] font-medium text-[var(--account-plum)]"
                        : "text-[var(--account-muted)] hover:bg-[var(--account-lilac)]/50 hover:text-[var(--account-plum)]",
                    )}
                  >
                    {ar ? item.ar : item.en}
                  </button>
                );
              })}
              <Link
                href="/account/club"
                className="shrink-0 rounded-2xl border border-[var(--account-border)] bg-gradient-to-l from-[#f3edf7] to-white px-4 py-2.5 text-start text-[0.9rem] font-medium text-[var(--account-plum)] transition-colors duration-200 hover:border-[var(--account-orchid)]/50"
              >
                {ar ? "نادي الجمال" : "Beauty Club"}
              </Link>
            </nav>

            <div className="mt-8 hidden lg:block">
              <AccountLogoutButton
                ar={ar}
                busy={loggingOut}
                onClick={() => void onLogout()}
              />
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 space-y-8">
          {section === "overview" ? (
            <>
              {/* Hero */}
              <section className="relative overflow-hidden rounded-[28px] border border-[var(--account-border)] bg-white">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse 50% 80% at 100% 50%, rgba(212,196,224,0.35), transparent 55%), linear-gradient(135deg, #FBFAFC 0%, #F7F2F9 100%)",
                  }}
                />
                <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:p-10">
                  <div>
                    <p className="font-latin text-[11px] font-medium tracking-[0.22em] text-[var(--account-orchid)] uppercase">
                      My VELORA
                    </p>
                    <h1 className="font-display mt-3 text-[clamp(1.75rem,4vw,2.6rem)] font-semibold text-[var(--account-plum)]">
                      {ar ? `مرحباً، ${name}` : `Welcome, ${name}`}
                    </h1>
                    <p className="mt-3 text-[1rem] text-[var(--account-muted)]">
                      {ar
                        ? "يسعدنا أن نراكِ مجدداً في VELORA."
                        : "We’re glad to see you again at VELORA."}
                    </p>
                    <p className="font-latin mt-6 text-[0.95rem] leading-relaxed tracking-wide text-[var(--account-plum)]/70">
                      Your beauty.
                      <br />
                      Your rituals.
                      <br />
                      Your VELORA.
                    </p>
                  </div>
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[24px] lg:mx-0 lg:max-w-none">
                    <Image
                      src="/brand/account-hero.jpg"
                      alt=""
                      fill
                      className="object-cover object-[center_20%]"
                      sizes="(max-width: 1024px) 90vw, 380px"
                      priority
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(58,24,54,0.12)] to-transparent" />
                  </div>
                </div>
              </section>

              {/* Stats */}
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label={ar ? "طلباتك" : "Orders"}
                  value={String(myOrders.length).padStart(2, "0")}
                  icon="bag"
                />
                <StatCard
                  label={ar ? "قائمة الأمنيات" : "Wishlist"}
                  value={String(wishCount).padStart(2, "0")}
                  icon="heart"
                  onClick={() => goTo("wishlist")}
                />
                <StatCard
                  label={ar ? "نقاط VELORA" : "VELORA points"}
                  value={(myOrders.length * 120 + wishCount * 10 || 0).toLocaleString(
                    ar ? "ar-IQ" : "en-US",
                  )}
                  icon="spark"
                  onClick={() => router.push("/account/club")}
                />
                <StatCard
                  label={ar ? "طلبات قيد الوصول" : "On the way"}
                  value={String(inTransit).padStart(2, "0")}
                  icon="truck"
                />
              </section>

              {/* Latest order */}
              <section className="rounded-[24px] border border-[var(--account-border)] bg-white p-6 sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[1.25rem] font-semibold text-[var(--account-plum)]">
                      {ar ? "آخر طلب" : "Latest order"}
                    </h2>
                    {latest ? (
                      <p className="font-latin mt-1 text-[0.85rem] text-[var(--account-muted)]" dir="ltr">
                        #{latest.orderId}
                      </p>
                    ) : null}
                  </div>
                  {latest ? (
                    <Link
                      href={`/track/${latest.orderId}`}
                      className="rounded-full bg-[var(--account-plum)] px-5 py-2.5 text-[0.85rem] font-medium text-white"
                    >
                      {ar ? "تتبعي الطلب" : "Track order"}
                    </Link>
                  ) : null}
                </div>

                {ordersLoading ? (
                  <p className="mt-6 text-[0.9rem] text-[var(--account-muted)]">
                    {ar ? "جارٍ التحميل…" : "Loading…"}
                  </p>
                ) : latest ? (
                  <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
                    <div>
                      <ul className="space-y-3">
                        {(latest.items || []).map((item, i) => (
                          <li
                            key={`${item.nameAr}-${i}`}
                            className="flex items-center justify-between gap-3 border-b border-[var(--account-border)] pb-3 text-[0.9rem]"
                          >
                            <span className="text-[var(--account-plum)]">
                              {ar ? item.nameAr : item.name}
                              <span className="ms-2 text-[var(--account-muted)]">
                                ×{item.quantity}
                              </span>
                            </span>
                            <span className="font-latin text-[var(--account-muted)]" dir="ltr">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-[1.05rem] font-semibold text-[var(--account-plum)]">
                        {ar ? "الإجمالي" : "Total"}: {latest.totalLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.8rem] text-[var(--account-muted)]">
                        {ar ? "رحلة طلبكِ" : "Order journey"}
                      </p>
                      <ol className="mt-4 space-y-0">
                        {timeline.map((label, i) => {
                          const active = i <= progressIndex(latest.status);
                          return (
                            <li key={label} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <span
                                  className={cn(
                                    "flex h-3.5 w-3.5 rounded-full border-2",
                                    active
                                      ? "border-[var(--account-plum)] bg-[var(--account-orchid)]"
                                      : "border-[var(--account-border)] bg-white",
                                  )}
                                />
                                {i < timeline.length - 1 ? (
                                  <span
                                    className={cn(
                                      "my-1 w-px flex-1 min-h-[28px]",
                                      active && i < progressIndex(latest.status)
                                        ? "bg-[var(--account-orchid)]"
                                        : "bg-[var(--account-border)]",
                                    )}
                                  />
                                ) : null}
                              </div>
                              <span
                                className={cn(
                                  "pb-5 text-[0.9rem]",
                                  active
                                    ? "font-medium text-[var(--account-plum)]"
                                    : "text-[var(--account-muted)]",
                                )}
                              >
                                {label}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-[18px] border border-dashed border-[var(--account-border)] px-5 py-10 text-center">
                    <p className="text-[0.95rem] text-[var(--account-muted)]">
                      {ar
                        ? "لا توجد طلبات بعد — ابدئي رحلتكِ من المتجر."
                        : "No orders yet — begin your edit in the shop."}
                    </p>
                    <Link
                      href="/shop"
                      className="mt-4 inline-block text-[0.875rem] text-[var(--account-plum)] underline underline-offset-4"
                    >
                      {ar ? "تسوّقي الآن" : "Shop now"}
                    </Link>
                  </div>
                )}
              </section>

              {/* Ritual / LARSA */}
              <section className="relative overflow-hidden rounded-[28px] border border-[var(--account-border)]">
                <div className="absolute inset-0">
                  <Image
                    src="/brand/account-ritual.jpg"
                    alt=""
                    fill
                    className="object-cover object-[center_25%]"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-[rgba(58,24,54,0.55)] via-[rgba(58,24,54,0.35)] to-[rgba(248,244,251,0.75)]" />
                </div>
                <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                  <div className="max-w-lg text-white">
                    <h2 className="font-display text-[clamp(1.5rem,3vw,2.1rem)] font-semibold">
                      {ar ? "طقسك الجمالي" : "Your beauty ritual"}
                    </h2>
                    <p className="mt-3 text-[0.95rem] text-white/80">
                      {ar
                        ? "اكتشفي المنتجات التي تناسب احتياجاتك."
                        : "Discover products that match your needs."}
                    </p>
                    <Link
                      href="/advisor"
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.875rem] font-medium text-[var(--account-plum)]"
                    >
                      {ar ? "ابدئي مع لارسا" : "Begin with LARSA"}
                      <span aria-hidden>✦</span>
                    </Link>
                  </div>
                  <div className="rounded-[20px] border border-white/35 bg-white/20 p-5 text-white backdrop-blur-md lg:justify-self-end lg:w-full lg:max-w-xs">
                    <p className="font-latin text-[11px] tracking-[0.2em] uppercase">
                      LARSA
                    </p>
                    <p className="mt-2 text-[1.05rem] font-medium">
                      {ar ? "مستشارتك الذكية" : "Your smart advisor"}
                    </p>
                    <p className="mt-1 text-[0.85rem] text-white/75">
                      {ar ? "للعناية والجمال" : "for care & beauty"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Lower grid */}
              <section className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-[22px] border border-[var(--account-border)] bg-white p-5 sm:p-6 lg:col-span-1">
                  <h3 className="font-display text-[1.1rem] font-semibold text-[var(--account-plum)]">
                    {ar ? "محفوظاتك الجميلة" : "Your saved pieces"}
                  </h3>
                  <p className="mt-1 text-[0.8rem] text-[var(--account-muted)]">
                    {ar
                      ? "الأشياء التي أحببتِها ولم تختاريها بعد."
                      : "Pieces you loved but haven’t chosen yet."}
                  </p>
                  <div className="mt-5 space-y-4">
                    {wishProducts.slice(0, 3).map((p) => (
                      <WishRow
                        key={p.id}
                        product={p}
                        ar={ar}
                        onToggle={() => void toggle(p.id)}
                        onAdd={() => addItem(toProduct(p))}
                      />
                    ))}
                    {!wishProducts.length ? (
                      <p className="py-6 text-center text-[0.85rem] text-[var(--account-muted)]">
                        {ar ? "قائمتكِ فارغة حالياً." : "Your list is empty for now."}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo("wishlist")}
                    className="mt-4 text-[0.8rem] text-[var(--account-plum)] underline underline-offset-4"
                  >
                    {ar ? "عرض الكل" : "View all"}
                  </button>
                </div>

                <div className="rounded-[22px] border border-[var(--account-border)] bg-white p-5 sm:p-6">
                  <h3 className="font-display text-[1.1rem] font-semibold text-[var(--account-plum)]">
                    {ar ? "عناوين التوصيل" : "Delivery addresses"}
                  </h3>
                  <div className="mt-5 rounded-[16px] border border-[var(--account-border)] bg-[var(--account-lilac)]/40 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[0.95rem] font-medium text-[var(--account-plum)]">
                          {ar ? "المنزل" : "Home"}
                        </p>
                        <p className="mt-1 text-[0.85rem] text-[var(--account-muted)]">
                          {customer.address ||
                            (ar ? "أضيفي عنوانكِ الافتراضي" : "Add your default address")}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] text-[var(--account-plum)] ring-1 ring-[var(--account-border)]">
                        {ar ? "افتراضي" : "Default"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo("addresses")}
                    className="mt-4 text-[0.85rem] text-[var(--account-plum)]"
                  >
                    {ar ? "+ إضافة عنوان جديد" : "+ Add a new address"}
                  </button>
                </div>

                <div className="rounded-[22px] border border-[var(--account-border)] bg-white p-5 sm:p-6">
                  <h3 className="font-display text-[1.1rem] font-semibold text-[var(--account-plum)]">
                    {ar ? "معلوماتك" : "Your details"}
                  </h3>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--account-lilac)] font-latin text-lg font-semibold text-[var(--account-plum)]">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--account-plum)]">
                        {customer.fullName}
                      </p>
                      <p className="truncate text-[0.8rem] text-[var(--account-muted)]" dir="ltr">
                        {customer.email}
                      </p>
                      <p className="text-[0.8rem] text-[var(--account-muted)]" dir="ltr">
                        {formatIraqMobileLocal(customer.phone) || customer.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo("profile")}
                    className="mt-5 rounded-full border border-[var(--account-border)] px-4 py-2 text-[0.85rem] text-[var(--account-plum)] hover:bg-[var(--account-lilac)]/50"
                  >
                    {ar ? "تعديل المعلومات" : "Edit details"}
                  </button>
                </div>
              </section>

              {/* Beauty Club CTA */}
              <section
                className="relative overflow-hidden rounded-[28px] border border-[var(--account-border)] px-6 py-9 sm:px-10"
                style={{
                  background:
                    "linear-gradient(145deg, #F3EDF7 0%, #FBFAFC 42%, #EDE4F2 100%)",
                }}
              >
                <div
                  className="pointer-events-none absolute -end-8 -top-10 h-40 w-40 rounded-full opacity-40"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(196,176,208,0.55), transparent 70%)",
                  }}
                />
                <p className="font-brand relative text-[1.05rem] tracking-[0.24em] text-[var(--account-plum)]">
                  VELORA
                </p>
                <h2 className="font-latin relative mt-2 text-[1.4rem] font-semibold tracking-[0.08em] text-[var(--account-plum)]">
                  VELORA BEAUTY CLUB
                </h2>
                <p className="relative mt-3 max-w-md text-[0.95rem] leading-relaxed text-[var(--account-muted)]">
                  {ar
                    ? "أكثر من نقاط… إنها تجربتكِ مع VELORA. ادخلي عالم الامتيازات الفاخر."
                    : "More than points. A beauty experience. Enter your private membership world."}
                </p>
                <Link
                  href="/account/club"
                  className="relative mt-7 inline-flex items-center justify-center rounded-full bg-[var(--account-plum)] px-6 py-3 text-[0.82rem] font-medium tracking-[0.1em] text-white transition-transform duration-200 hover:scale-[1.02] hover:bg-[var(--account-plum)]/90"
                >
                  {ar ? "ادخلي نادي VELORA" : "Enter VELORA Beauty Club"}
                </Link>
              </section>

              <section className="rounded-[22px] border border-[rgba(168,62,72,0.12)] bg-gradient-to-l from-[#fdf6f7] to-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[0.95rem] font-semibold text-[#9b3440]">
                      {ar ? "إنهاء الجلسة" : "End session"}
                    </p>
                    <p className="mt-1 text-[0.8rem] text-[var(--account-muted)]">
                      {ar
                        ? "سجّلي الخروج بأمان من حسابكِ على هذا الجهاز."
                        : "Sign out securely from your account on this device."}
                    </p>
                  </div>
                  <div className="w-full sm:w-auto sm:min-w-[200px]">
                    <AccountLogoutButton
                      ar={ar}
                      busy={loggingOut}
                      variant="solid"
                      onClick={() => void onLogout()}
                    />
                  </div>
                </div>
              </section>

              <ServiceStrip ar={ar} />
            </>
          ) : null}

          {section === "wishlist" ? (
            <section>
              <div className="mb-8">
                <h2 className="font-display text-[1.6rem] font-semibold text-[var(--account-plum)] sm:text-[1.85rem]">
                  {ar ? "محفوظاتك الجميلة" : "Your beautiful saves"}
                </h2>
                <p className="mt-2 max-w-xl text-[0.95rem] text-[var(--account-muted)]">
                  {ar
                    ? "المنتجات التي أحببتِها وتريدين الاحتفاظ بها لوقت لاحق."
                    : "Pieces you loved and want to keep for later."}
                </p>
              </div>

              {wishProducts.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {wishProducts.map((p) => (
                    <WishGridCard
                      key={p.id}
                      product={p}
                      ar={ar}
                      onToggle={() => void toggle(p.id)}
                      onAdd={() => addItem(toProduct(p))}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-[var(--account-border)] bg-white px-6 py-16 text-center">
                  <p className="text-[1.75rem] text-[var(--account-orchid)]" aria-hidden>
                    ♡
                  </p>
                  <h3 className="mt-4 font-display text-[1.2rem] font-semibold text-[var(--account-plum)]">
                    {ar ? "لم تحفظي أي منتجات بعد" : "Nothing saved yet"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-[0.9rem] text-[var(--account-muted)]">
                    {ar
                      ? "اكتشفي منتجاتك المفضلة واحتفظي بها هنا لتعودي إليها متى شئتِ."
                      : "Discover your favorites and keep them here to return whenever you like."}
                  </p>
                  <Link
                    href="/shop"
                    className="mt-8 inline-flex rounded-full bg-[var(--account-plum)] px-6 py-2.5 text-[0.85rem] font-medium text-white"
                  >
                    {ar ? "اكتشفي المنتجات" : "Discover products"}
                  </Link>
                </div>
              )}
            </section>
          ) : null}

          {section === "orders" ? (
            <Panel title={ar ? "طلباتي" : "My orders"}>
              {ordersError ? (
                <p className="text-red-700">{ordersError}</p>
              ) : null}
              <div className="space-y-3">
                {myOrders.map((o) => (
                  <Link
                    key={o.orderId}
                    href={`/track/${o.orderId}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[var(--account-border)] px-4 py-4 transition-colors hover:bg-[var(--account-lilac)]/35"
                  >
                    <div>
                      <p className="font-latin text-[0.85rem] text-[var(--account-muted)]" dir="ltr">
                        #{o.orderId}
                      </p>
                      <p className="mt-1 text-[0.95rem] text-[var(--account-plum)]">
                        {o.statusLabel} · {o.itemCount}{" "}
                        {ar ? "منتج" : "items"}
                      </p>
                    </div>
                    <p className="font-medium text-[var(--account-plum)]">{o.totalLabel}</p>
                  </Link>
                ))}
                {!myOrders.length && !ordersLoading ? (
                  <Empty
                    ar={ar}
                    text={ar ? "لا توجد طلبات." : "No orders yet."}
                    href="/shop"
                    cta={ar ? "تسوّقي" : "Shop"}
                  />
                ) : null}
              </div>
              <form
                className="mt-8 flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (orderId.trim()) router.push(`/track/${orderId.trim()}`);
                }}
              >
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder={ar ? "رقم الطلب…" : "Order number…"}
                  className="account-input flex-1"
                  dir="ltr"
                />
                <button type="submit" className="account-btn">
                  {ar ? "تتبعي" : "Track"}
                </button>
              </form>
            </Panel>
          ) : null}

          {section === "addresses" || section === "profile" ? (
            <Panel
              title={
                section === "addresses"
                  ? ar
                    ? "عناويني"
                    : "Addresses"
                  : ar
                    ? "معلوماتي"
                    : "Profile"
              }
            >
              <form onSubmit={onSaveProfile} className="max-w-lg space-y-4">
                {section === "profile" ? (
                  <>
                    <Field label={ar ? "الاسم الكامل" : "Full name"}>
                      <input
                        className="account-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </Field>
                    <Field label={ar ? "البريد" : "Email"}>
                      <input className="account-input" value={customer.email} disabled dir="ltr" />
                    </Field>
                    <Field label={ar ? "الهاتف" : "Phone"}>
                      <input
                        className="account-input"
                        value={formatIraqMobileLocal(customer.phone) || customer.phone}
                        disabled
                        dir="ltr"
                      />
                    </Field>
                  </>
                ) : null}
                <Field label={ar ? "عنوان التوصيل الافتراضي" : "Default delivery address"}>
                  <textarea
                    className="account-input min-h-[100px]"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={ar ? "بغداد — الكرادة…" : "Baghdad — Karrada…"}
                  />
                </Field>
                {profileError ? <p className="text-sm text-red-700">{profileError}</p> : null}
                {profileMessage ? (
                  <p className="text-sm text-[var(--account-plum)]">{profileMessage}</p>
                ) : null}
                <button type="submit" disabled={savingProfile} className="account-btn">
                  {savingProfile
                    ? ar
                      ? "جارٍ الحفظ…"
                      : "Saving…"
                    : ar
                      ? "حفظ"
                      : "Save"}
                </button>
              </form>
            </Panel>
          ) : null}

          {section === "settings" ? (
            <div className="space-y-6">
              <Panel title={ar ? "المظهر" : "Appearance"}>
                <div className="flex flex-wrap gap-2">
                  {(["light", "dark"] as ThemeMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTheme(mode)}
                      className={cn(
                        "rounded-full px-4 py-2 text-[0.85rem]",
                        theme === mode
                          ? "bg-[var(--account-plum)] text-white"
                          : "border border-[var(--account-border)] text-[var(--account-plum)]",
                      )}
                    >
                      {mode === "light"
                        ? ar
                          ? "نهاري"
                          : "Light"
                        : ar
                          ? "ليلي"
                          : "Dark"}
                    </button>
                  ))}
                </div>
              </Panel>
              <Panel title={ar ? "الأمان" : "Security"}>
                <form onSubmit={onSavePassword} className="max-w-lg space-y-4">
                  <Field label={ar ? "كلمة المرور الحالية" : "Current password"}>
                    <input
                      type="password"
                      className="account-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label={ar ? "كلمة المرور الجديدة" : "New password"}>
                    <input
                      type="password"
                      className="account-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </Field>
                  <Field label={ar ? "تأكيد كلمة المرور" : "Confirm password"}>
                    <input
                      type="password"
                      className="account-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </Field>
                  {securityError ? <p className="text-sm text-red-700">{securityError}</p> : null}
                  {securityMessage ? (
                    <p className="text-sm text-[var(--account-plum)]">{securityMessage}</p>
                  ) : null}
                  <button type="submit" disabled={savingPassword} className="account-btn">
                    {savingPassword
                      ? ar
                        ? "جارٍ التحديث…"
                        : "Updating…"
                      : ar
                        ? "تحديث كلمة المرور"
                        : "Update password"}
                  </button>
                </form>
              </Panel>
              <div className="lg:hidden">
                <AccountLogoutButton
                  ar={ar}
                  busy={loggingOut}
                  variant="solid"
                  onClick={() => void onLogout()}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AccountLogoutButton({
  ar,
  busy,
  onClick,
  variant = "soft",
}: {
  ar: boolean;
  busy?: boolean;
  onClick: () => void;
  variant?: "soft" | "solid";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "account-logout-btn",
        variant === "solid" && "account-logout-btn--solid",
      )}
    >
      <LogoutIcon />
      <span>
        {busy
          ? ar
            ? "جارٍ الخروج…"
            : "Signing out…"
          : ar
            ? "تسجيل الخروج"
            : "Sign out"}
      </span>
    </button>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  icon: "bag" | "heart" | "spark" | "truck";
  onClick?: () => void;
}) {
  const className =
    "rounded-[20px] border border-[var(--account-border)] bg-white px-5 py-5 text-start transition-colors duration-300";
  const body = (
    <>
      <div className="flex items-start justify-between">
        <MiniIcon name={icon} />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--account-orchid)]" />
      </div>
      <p className="font-latin mt-4 text-[1.85rem] font-semibold tracking-tight text-[var(--account-plum)]">
        {value}
      </p>
      <p className="mt-1 text-[0.8rem] text-[var(--account-muted)]">{label}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(className, "hover:border-[var(--account-orchid)]/50 hover:bg-[var(--account-lilac)]/30")}
      >
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}

function WishGridCard({
  product,
  ar,
  onToggle,
  onAdd,
}: {
  product: WishProduct;
  ar: boolean;
  onToggle: () => void;
  onAdd: () => void;
}) {
  const inStock = product.inStock !== false && (product.stock ?? 1) > 0;
  const brand = getProductBrand(product.name, product.nameAr);
  return (
    <article className="overflow-hidden rounded-[22px] border border-[var(--account-border)] bg-white">
      <div className="relative">
        <Link href={`/shop/${product.slug}`} className="block">
          <ProductMedia
            name={ar ? product.nameAr : product.name}
            imageTone={product.imageTone}
            imageUrl={product.imageUrl}
            aspectClassName="aspect-[3/4]"
            sizes="(max-width: 640px) 90vw, 280px"
          />
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-label="wishlist"
          className="absolute top-3 end-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--account-plum)] backdrop-blur-sm"
        >
          ♥
        </button>
      </div>
      <div className="p-4">
        <p
          className="font-latin truncate text-[10px] tracking-[0.14em] text-[var(--account-muted)] uppercase"
          dir="ltr"
        >
          {brand}
        </p>
        <Link
          href={`/shop/${product.slug}`}
          className="mt-1 block line-clamp-2 text-[0.95rem] font-medium text-[var(--account-plum)]"
        >
          {ar ? product.nameAr : product.name}
        </Link>
        <ProductPrice
          className="mt-2"
          size="sm"
          price={product.price}
          originalPrice={product.originalPrice}
          discountPercent={product.discountPercent}
        />
        <p
          className={cn(
            "mt-2 text-[0.75rem]",
            inStock ? "text-[var(--account-muted)]" : "text-red-700/80",
          )}
        >
          {inStock
            ? ar
              ? "متوفر"
              : "In stock"
            : ar
              ? "غير متوفر حالياً"
              : "Currently unavailable"}
        </p>
        {inStock ? (
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 w-full rounded-full border border-[var(--account-border)] py-2.5 text-[0.8rem] text-[var(--account-plum)] transition-colors hover:bg-[var(--account-lilac)]/50"
          >
            {ar ? "أضيفيه إلى الحقيبة" : "Add to bag"}
          </button>
        ) : (
          <p className="mt-4 py-2.5 text-center text-[0.8rem] text-[var(--account-muted)]">
            {ar ? "غير متوفر حالياً" : "Currently unavailable"}
          </p>
        )}
      </div>
    </article>
  );
}

function WishRow({
  product,
  ar,
  onToggle,
  onAdd,
  large,
}: {
  product: WishProduct;
  ar: boolean;
  onToggle: () => void;
  onAdd: () => void;
  large?: boolean;
}) {
  const inStock = product.inStock !== false && (product.stock ?? 1) > 0;
  return (
    <div className={cn("flex gap-3", large && "rounded-[16px] border border-[var(--account-border)] p-3")}>
      <Link href={`/shop/${product.slug}`} className="relative block h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--account-lilac)]">
        <ProductMedia
          name={ar ? product.nameAr : product.name}
          imageTone={product.imageTone}
          imageUrl={product.imageUrl}
          aspectClassName="h-full w-full"
          className="!aspect-auto h-full min-h-full"
          sizes="64px"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="font-latin truncate text-[10px] tracking-[0.12em] text-[var(--account-muted)] uppercase" dir="ltr">
          {product.name}
        </p>
        <Link href={`/shop/${product.slug}`} className="mt-0.5 block truncate text-[0.9rem] font-medium text-[var(--account-plum)]">
          {ar ? product.nameAr : product.name}
        </Link>
        <ProductPrice className="mt-1" size="sm" price={product.price} originalPrice={product.originalPrice} discountPercent={product.discountPercent} />
        <div className="mt-2 flex flex-wrap gap-2">
          {inStock ? (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-full border border-[var(--account-border)] px-3 py-1 text-[10px] text-[var(--account-plum)] hover:bg-[var(--account-lilac)]/50"
            >
              {ar ? "أضيفيه إلى حقيبتك" : "Add to bag"}
            </button>
          ) : (
            <span className="px-1 py-1 text-[10px] text-red-700/80">
              {ar ? "غير متوفر حالياً" : "Currently unavailable"}
            </span>
          )}
          <button type="button" onClick={onToggle} className="text-[10px] text-[var(--account-muted)]" aria-label="wishlist">
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[var(--account-border)] bg-white p-6 sm:p-8">
      <h2 className="font-display text-[1.25rem] font-semibold text-[var(--account-plum)]">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.8rem] text-[var(--account-muted)]">{label}</span>
      {children}
    </label>
  );
}

function Empty({
  ar,
  text,
  href,
  cta,
}: {
  ar: boolean;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-[var(--account-border)] px-5 py-10 text-center">
      <p className="text-[0.9rem] text-[var(--account-muted)]">{text}</p>
      <Link href={href} className="mt-3 inline-block text-[0.85rem] text-[var(--account-plum)] underline underline-offset-4">
        {cta}
      </Link>
    </div>
  );
}

function ServiceStrip({ ar }: { ar: boolean }) {
  const items = ar
    ? [
        { t: "تغليف فاخر", d: "نهتم بتفاصيل تجربتك" },
        { t: "توصيل سريع وآمن", d: "إلى جميع مناطق العراق" },
        { t: "منتجات أصلية 100%", d: "من أفضل العلامات العالمية" },
        { t: "خدمة عملاء راقية", d: "نحن هنا لمساعدتك دائماً" },
      ]
    : [
        { t: "Luxury wrapping", d: "We care for every detail" },
        { t: "Fast & secure delivery", d: "Across all of Iraq" },
        { t: "100% authentic", d: "From the world’s finest houses" },
        { t: "Refined client care", d: "We’re always here for you" },
      ];
  return (
    <section className="grid gap-4 rounded-[22px] border border-[var(--account-border)] bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.t} className="text-center sm:text-start">
          <p className="text-[0.9rem] font-medium text-[var(--account-plum)]">{item.t}</p>
          <p className="mt-1 text-[0.75rem] text-[var(--account-muted)]">{item.d}</p>
        </div>
      ))}
    </section>
  );
}

function MiniIcon({ name }: { name: "bag" | "heart" | "spark" | "truck" }) {
  const common = "text-[var(--account-plum)]";
  if (name === "heart") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
        <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.8C19 15.6 12 20 12 20Z" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  if (name === "spark") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
        <path d="M12 3 13.2 9.2 19.5 10.5 13.2 11.8 12 18 10.8 11.8 4.5 10.5 10.8 9.2 12 3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "truck") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
        <path d="M3 7h11v10H3V7Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M14 10h4l3 3v4h-7v-7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <circle cx="7" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="17" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={common} aria-hidden>
      <path d="M4 8h16l-1.2 11.2A2 2 0 0 1 16.81 21H7.19a2 2 0 0 1-1.99-1.8L4 8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 8V6.5A4 4 0 0 1 12 2.5 4 4 0 0 1 16 6.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
