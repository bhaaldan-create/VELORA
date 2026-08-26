"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClubLogo } from "@/components/club/ClubLogo";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
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
import { getDefaultWhatsAppUrl } from "@/lib/social-links";
import { cn } from "@/lib/utils";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    try {
      setAvatarUrl(
        window.localStorage.getItem(`velora-avatar-${customer.id}`),
      );
    } catch {
      setAvatarUrl(null);
    }
  }, [customer]);

  function onAvatarSelected(file: File | undefined) {
    if (!file || !customer) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      if (!data) return;
      try {
        window.localStorage.setItem(`velora-avatar-${customer.id}`, data);
      } catch {
        /* ignore quota */
      }
      setAvatarUrl(data);
    };
    reader.readAsDataURL(file);
  }

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
  const pointsValue = myOrders.length * 120 + wishCount * 10;
  const orderStages = {
    placed: myOrders.filter((o) => progressIndex(o.status) === 0).length,
    preparing: myOrders.filter((o) => progressIndex(o.status) === 1).length,
    shipping: myOrders.filter((o) => progressIndex(o.status) === 2).length,
    delivered: myOrders.filter((o) => progressIndex(o.status) === 3).length,
  };
  const hotStage =
    orderStages.shipping > 0
      ? "shipping"
      : orderStages.preparing > 0
        ? "preparing"
        : orderStages.placed > 0
          ? "placed"
          : "delivered";
  const initial = name.slice(0, 1).toUpperCase();
  const helpUrl = getDefaultWhatsAppUrl(ar ? "ar" : "en") || "/advisor";
  const couponCount = Math.min(5, Math.floor(pointsValue / 200));

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
          <div className="rounded-[22px] border border-[var(--account-border)] bg-[var(--bg-elevated)] px-5 py-6 lg:sticky lg:top-24">
            {/* dir=ltr يمنع عكس حرفَي My في الواجهة العربية */}
            <div className="text-center" dir="ltr">
              <p className="font-latin text-[0.62rem] font-medium tracking-[0.38em] text-[var(--account-muted)] uppercase">
                My
              </p>
              <p className="font-latin mt-1.5 text-[1.4rem] font-semibold leading-none tracking-[0.28em] text-[var(--account-plum)] uppercase">
                Velora
              </p>
              <span
                className="mx-auto mt-3 block h-px w-9 bg-[var(--account-orchid)]/50"
                aria-hidden
              />
              <p className="mt-3 text-[0.78rem] leading-relaxed text-[var(--account-muted)]" dir={ar ? "rtl" : "ltr"}>
                {ar ? "مساحتك الخاصة" : "Your private space"}
              </p>
            </div>

            <nav className="mt-7 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {NAV.map((item) => {
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.id)}
                    className={cn(
                      "shrink-0 rounded-2xl px-4 py-2.5 text-center text-[0.9rem] transition-colors duration-200 lg:text-start",
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
                href="/account/my-velora"
                className="shrink-0 rounded-2xl border border-[var(--account-border)] bg-[var(--account-lilac)]/40 px-3 py-2.5 text-center text-[0.86rem] font-medium text-[var(--account-plum)] transition-colors duration-200 hover:bg-[var(--account-lilac)] lg:text-start"
              >
                <span className="inline-flex items-center justify-center gap-2 lg:justify-start">
                  <span aria-hidden>✦</span>
                  <span>{ar ? "MY VELORA" : "MY VELORA"}</span>
                </span>
              </Link>
              <Link
                href="/account/my-velora/passport"
                className="shrink-0 rounded-2xl border border-[var(--account-border)] bg-white/70 px-3 py-2.5 text-center text-[0.86rem] font-medium text-[var(--account-plum)] transition-colors duration-200 hover:bg-[var(--account-lilac)] lg:text-start"
              >
                <span className="inline-flex items-center justify-center gap-2 lg:justify-start">
                  <span aria-hidden>◇</span>
                  <span>{ar ? "جواز VELORA" : "My Passport"}</span>
                </span>
              </Link>
              <Link
                href="/account/club"
                className="shrink-0 rounded-2xl border border-[var(--account-border)] bg-[var(--account-lilac)]/40 px-3 py-2.5 text-center text-[0.86rem] font-medium text-[var(--account-plum)] transition-colors duration-200 hover:bg-[var(--account-lilac)] lg:text-start"
              >
                <span className="inline-flex items-center justify-center gap-2.5 lg:justify-start">
                  <ClubLogo height={26} />
                  <span>{ar ? "نادي الجمال" : "Beauty Club"}</span>
                </span>
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
              {/* Profile hero */}
              <section className="acc-hero">
                <div className="acc-hero-inner">
                  <div className="min-w-0 flex-1">
                    <h1 className="acc-greeting">
                      {ar ? `مرحباً، ${name}` : `Welcome, ${name}`}
                    </h1>
                    <p className="acc-welcome">
                      <AccIcon name="heart" size={14} />
                      {ar
                        ? "يسعدنا أن نراك مجدداً في VELORA."
                        : "We’re glad to see you again at VELORA."}
                    </p>
                    <button
                      type="button"
                      className="acc-edit-btn"
                      onClick={() => goTo("profile")}
                    >
                      {ar ? "تعديل الملف الشخصي" : "Edit profile"}
                      <AccIcon name="edit" size={13} />
                    </button>
                  </div>

                  <div className="acc-avatar-wrap">
                    <div className="acc-avatar-ring">
                      <div className="acc-avatar-inner">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="" />
                        ) : (
                          initial
                        )}
                      </div>
                    </div>
                    <label className="acc-avatar-cam" title={ar ? "صورة الملف" : "Profile photo"}>
                      <AccIcon name="camera" size={13} />
                      <input
                        type="file"
                        accept="image/*"
                        aria-label={ar ? "رفع صورة الملف" : "Upload profile photo"}
                        onChange={(e) => {
                          onAvatarSelected(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="acc-philosophy" aria-label="VELORA philosophy">
                  <span>
                    <AccIcon name="spark" size={13} />
                    {ar ? "جمالكِ" : "Your beauty"}
                  </span>
                  <i aria-hidden />
                  <span>
                    <AccIcon name="leaf" size={13} />
                    {ar ? "طقوسكِ" : "Your rituals"}
                  </span>
                  <i aria-hidden />
                  <span>
                    <AccIcon name="diamond" size={13} />
                    {ar ? "فيلورا" : "Your VELORA"}
                  </span>
                </div>
              </section>

              <Link
                href="/account/my-velora/passport"
                className="acc-passport-hero block overflow-hidden rounded-[20px] border border-[var(--account-border)] bg-gradient-to-br from-[#FAF9FC] via-[#F5F1FB] to-[#E8E0F8] px-5 py-6 shadow-[0_18px_50px_rgba(90,74,122,0.1)] transition hover:-translate-y-0.5"
              >
                <p className="font-latin text-[0.58rem] tracking-[0.38em] text-[#7E68B5]">
                  MY VELORA PASSPORT
                </p>
                <p className="font-display mt-2 text-[1.2rem] tracking-[0.04em] text-[#24202B]">
                  {ar ? "جوازكِ الرقمي" : "Your Digital Passport"}
                </p>
                <p className="mt-2 max-w-md text-[0.82rem] leading-relaxed text-[#777080]">
                  {ar
                    ? "هويتكِ داخل VELORA — المستوى، XP، الإنجازات، والتحقق."
                    : "Your identity inside VELORA — level, XP, achievements, and verification."}
                </p>
                <span className="mt-4 inline-flex rounded-full bg-[#24202B] px-5 py-2 font-latin text-[0.6rem] tracking-[0.24em] text-white uppercase">
                  {ar ? "فتح الجواز" : "Open Passport"}
                </span>
              </Link>

              {/* Stats */}
              <section className="acc-card mt-5 sm:mt-6">
                <div className="acc-stats">
                  <button
                    type="button"
                    className="acc-stat"
                    onClick={() => goTo("wishlist")}
                  >
                    <span className="ico">
                      <AccIcon name="heart" size={16} />
                    </span>
                    <p className="num">{wishCount}</p>
                    <p className="lbl">{ar ? "المفضلة" : "Saved"}</p>
                  </button>
                  <button
                    type="button"
                    className="acc-stat"
                    onClick={() => goTo("settings")}
                  >
                    <span className="ico">
                      <AccIcon name="ticket" size={16} />
                    </span>
                    <p className="num">{couponCount}</p>
                    <p className="lbl">{ar ? "الكوبونات" : "Coupons"}</p>
                  </button>
                  <button
                    type="button"
                    className="acc-stat"
                    onClick={() => router.push("/account/club")}
                  >
                    <span className="ico">
                      <AccIcon name="points" size={16} />
                    </span>
                    <p className="num">
                      {pointsValue.toLocaleString(ar ? "ar-IQ" : "en-US")}
                    </p>
                    <p className="lbl">{ar ? "النقاط" : "Points"}</p>
                  </button>
                  <button
                    type="button"
                    className="acc-stat"
                    onClick={() => goTo("orders")}
                  >
                    <span className="ico">
                      <AccIcon name="package" size={16} />
                    </span>
                    <p className="num">{myOrders.length}</p>
                    <p className="lbl">{ar ? "الطلبات" : "Orders"}</p>
                  </button>
                </div>
              </section>

              {/* Orders timeline */}
              <section className="acc-card mt-5 sm:mt-6">
                <div className="acc-section-head">
                  <h2>{ar ? "طلباتي" : "My orders"}</h2>
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => goTo("orders")}
                  >
                    {ar ? "عرض جميع الطلبات ←" : "View all orders →"}
                  </button>
                </div>
                {ordersLoading ? (
                  <p className="text-[0.85rem] text-[var(--account-muted)]">
                    {ar ? "جارٍ التحميل…" : "Loading…"}
                  </p>
                ) : (
                  <div className="acc-order-rail">
                    {(
                      [
                        {
                          id: "placed" as const,
                          ar: "قيد الطلب",
                          en: "Placed",
                          icon: "bag" as const,
                          n: orderStages.placed,
                        },
                        {
                          id: "preparing" as const,
                          ar: "قيد التجهيز",
                          en: "Preparing",
                          icon: "spark" as const,
                          n: orderStages.preparing,
                        },
                        {
                          id: "shipping" as const,
                          ar: "قيد التوصيل",
                          en: "Shipping",
                          icon: "truck" as const,
                          n: orderStages.shipping,
                        },
                        {
                          id: "delivered" as const,
                          ar: "تم التوصيل",
                          en: "Delivered",
                          icon: "check" as const,
                          n: orderStages.delivered,
                        },
                      ] as const
                    ).map((stage) => (
                      <div
                        key={stage.id}
                        className={`acc-order-stage ${hotStage === stage.id ? "is-hot" : ""}`}
                      >
                        <div className="dot">
                          <AccIcon name={stage.icon} size={15} />
                        </div>
                        <p className="cnt">{stage.n}</p>
                        <p className="cap">{ar ? stage.ar : stage.en}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!ordersLoading && !myOrders.length ? (
                  <div className="mt-5 text-center">
                    <p className="text-[0.85rem] text-[var(--account-muted)]">
                      {ar
                        ? "لا توجد طلبات بعد — ابدئي رحلتكِ من المتجر."
                        : "No orders yet — begin your journey in the shop."}
                    </p>
                    <Link
                      href="/shop"
                      className="mt-3 inline-block text-[0.8rem] text-[var(--account-plum)] underline underline-offset-4"
                    >
                      {ar ? "تسوّقي الآن" : "Shop now"}
                    </Link>
                  </div>
                ) : null}
              </section>

              {/* Quick actions */}
              <section className="mt-5 sm:mt-6">
                <div className="acc-actions">
                  <button
                    type="button"
                    className="acc-action"
                    onClick={() => router.push("/account/notifications")}
                  >
                    <span className="bubble">
                      <AccIcon name="spark" size={17} />
                    </span>
                    <span className="title">
                      {ar ? "الإشعارات" : "Notifications"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="acc-action"
                    onClick={() => goTo("wishlist")}
                  >
                    <span className="bubble">
                      <AccIcon name="heart" size={17} />
                    </span>
                    <span className="title">
                      {ar ? "المفضلة" : "Favorites"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="acc-action"
                    onClick={() => goTo("settings")}
                  >
                    <span className="bubble">
                      <AccIcon name="card" size={17} />
                    </span>
                    <span className="title">
                      {ar ? "طرق الدفع" : "Payments"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="acc-action"
                    onClick={() => goTo("addresses")}
                  >
                    <span className="bubble">
                      <AccIcon name="pin" size={17} />
                    </span>
                    <span className="title">
                      {ar ? "العناوين" : "Addresses"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="acc-action"
                    onClick={() => goTo("settings")}
                  >
                    <span className="bubble">
                      <AccIcon name="settings" size={17} />
                    </span>
                    <span className="title">
                      {ar ? "الإعدادات" : "Settings"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="acc-action"
                    onClick={() => goTo("settings")}
                  >
                    <span className="bubble">
                      <AccIcon name="shield" size={17} />
                    </span>
                    <span className="title">
                      {ar ? "الخصوصية والأمان" : "Privacy"}
                    </span>
                  </button>
                  <a
                    href={helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="acc-action"
                  >
                    <span className="bubble">
                      <AccIcon name="support" size={17} />
                    </span>
                    <span className="title">
                      {ar ? "مركز المساعدة" : "Help center"}
                    </span>
                  </a>
                </div>
              </section>

              {/* Loyalty */}
              <section className="acc-loyalty mt-5 sm:mt-6 text-center">
                <div className="flex justify-center">
                  <ClubLogo height={40} />
                </div>
                <p className="mt-4 text-[0.65rem] tracking-[0.2em] uppercase opacity-75">
                  VELORA POINTS
                </p>
                <h2 className="mt-2 text-[1.15rem] font-semibold">
                  {ar ? "برنامج نقاط VELORA" : "VELORA Points Program"}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-[0.84rem] leading-relaxed opacity-80">
                  {ar
                    ? "تجميعك لنقاطك واستبدالها بمكافآت حصرية"
                    : "Collect points and redeem exclusive beauty rewards."}
                </p>
                <div className="acc-loyalty-ring">
                  <p className="num">
                    {pointsValue.toLocaleString(ar ? "ar-IQ" : "en-US")}
                  </p>
                  <p className="unit">{ar ? "نقطة" : "points"}</p>
                </div>
                <Link href="/account/club" className="acc-loyalty-cta">
                  {ar ? "عرض نقاطي" : "View my points"}
                  <span aria-hidden>←</span>
                </Link>
              </section>

              {/* Compact extras */}
              <section className="mt-5 grid gap-4 sm:mt-6 lg:grid-cols-2">
                <div className="acc-card">
                  <h3 className="text-[0.95rem] font-semibold text-[var(--account-plum)]">
                    {ar ? "محفوظاتك الجميلة" : "Your saved pieces"}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {wishProducts.slice(0, 2).map((p) => (
                      <WishRow
                        key={p.id}
                        product={p}
                        ar={ar}
                        onToggle={() => void toggle(p.id)}
                        onAdd={() => addItem(toProduct(p))}
                      />
                    ))}
                    {!wishProducts.length ? (
                      <p className="py-4 text-center text-[0.82rem] text-[var(--account-muted)]">
                        {ar ? "قائمتكِ فارغة حالياً." : "Your list is empty for now."}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo("wishlist")}
                    className="mt-3 text-[0.78rem] text-[var(--account-plum)] underline underline-offset-4"
                  >
                    {ar ? "عرض الكل" : "View all"}
                  </button>
                </div>

                <div className="acc-card">
                  <h3 className="text-[0.95rem] font-semibold text-[var(--account-plum)]">
                    {ar ? "لارسا" : "LARSA"}
                  </h3>
                  <p className="mt-2 text-[0.84rem] text-[var(--account-muted)]">
                    {ar
                      ? "مستشارتك الشخصية لاكتشاف روتين جمالكِ."
                      : "Your personal guide to discovering your beauty ritual."}
                  </p>
                  <Link
                    href="/advisor"
                    className="acc-edit-btn mt-4"
                  >
                    {ar ? "تحدثي مع لارسا" : "Talk to LARSA"}
                    <AccIcon name="spark" size={13} />
                  </Link>
                </div>
              </section>

              <section className="mt-5 rounded-[22px] border border-[var(--account-border)] bg-[var(--bg-elevated)] p-5 sm:mt-6 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[0.95rem] font-semibold text-[var(--plum)]">
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
                <div className="rounded-[24px] border border-[var(--account-border)] bg-[var(--bg-elevated)] px-6 py-16 text-center">
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
                    className="mt-8 inline-flex rounded-full bg-[var(--btn-bg)] px-6 py-2.5 text-[0.85rem] font-medium text-[var(--btn-fg)]"
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
                  <div
                    key={o.orderId}
                    className="rounded-[18px] border border-[var(--account-border)] px-4 py-4"
                  >
                    <Link
                      href={`/track/${o.orderId}`}
                      className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:opacity-90"
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
                    {o.status === "delivered" ? (
                      <Link
                        href={`/account/my-velora/${o.orderId}`}
                        className="mt-3 flex items-center justify-between rounded-[14px] bg-[var(--account-lilac)]/45 px-4 py-3 text-[0.88rem] text-[var(--account-plum)] transition-colors hover:bg-[var(--account-lilac)]/70"
                      >
                        <span>
                          {ar
                            ? "بطاقتك VELORA جاهزة ✦"
                            : "Your VELORA Card is Ready ✦"}
                        </span>
                        <span className="font-latin text-[0.78rem] tracking-[0.12em]">
                          {ar ? "عرض البطاقة ←" : "View Card →"}
                        </span>
                      </Link>
                    ) : null}
                  </div>
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
                        "rounded-full px-4 py-2 text-[0.85rem] transition-colors",
                        theme === mode
                          ? "bg-[var(--btn-bg)] text-[var(--btn-fg)]"
                          : "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--ink)] hover:border-[var(--plum)]/25",
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

function AccIcon({
  name,
  size = 18,
}: {
  name:
    | "heart"
    | "spark"
    | "leaf"
    | "diamond"
    | "edit"
    | "camera"
    | "ticket"
    | "points"
    | "package"
    | "bag"
    | "truck"
    | "check"
    | "card"
    | "pin"
    | "settings"
    | "shield"
    | "support";
  size?: number;
}) {
  const s = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.45,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "heart":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M12 20s-7-4.35-7-9.1A3.85 3.85 0 0112 7.2a3.85 3.85 0 017 3.7C19 15.65 12 20 12 20z" />
        </svg>
      );
    case "spark":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M12 3.5l1.1 5.2L18 10l-4.9 1.3L12 16.5l-1.1-5.2L6 10l4.9-1.3L12 3.5z" />
        </svg>
      );
    case "leaf":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M5 14c6-1 10-5 12-11-6 2-11 6-12 11z" />
          <path d="M7 17c2-3 5-5 9-6" />
        </svg>
      );
    case "diamond":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M12 3.5L20 9.5 12 20.5 4 9.5 12 3.5z" />
        </svg>
      );
    case "edit":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M4.5 16.5 15.8 5.2a1.8 1.8 0 012.5 2.5L7 19H4.5v-2.5z" />
        </svg>
      );
    case "camera":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M4.5 8.5h3l1.5-2h6l1.5 2h3v10h-15v-10z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "ticket":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M4 8.5a2 2 0 002 2 2 2 0 000 3 2 2 0 00-2 2v1.5h16V15.5a2 2 0 00-2-2 2 2 0 000-3 2 2 0 002-2V7H4v1.5z" />
        </svg>
      );
    case "points":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 8.5v7M9.5 12h5" />
        </svg>
      );
    case "package":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M4.5 8.5 12 4.5l7.5 4V16L12 20l-7.5-4V8.5z" />
          <path d="M12 12v8M4.5 8.5 12 12l7.5-3.5" />
        </svg>
      );
    case "bag":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M6 8.5h12l-1 10.5H7L6 8.5z" />
          <path d="M9 8.5V7a3 3 0 016 0v1.5" />
        </svg>
      );
    case "truck":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M3.5 16.5V8.5h10v8" />
          <path d="M13.5 10.5h4.2L20 13.8v2.7h-1.2" />
          <circle cx="7.2" cy="16.8" r="1.6" />
          <circle cx="16.8" cy="16.8" r="1.6" />
        </svg>
      );
    case "check":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M5.5 12.5l4 4 9-10" />
        </svg>
      );
    case "card":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
          <path d="M3.5 10.5h17" />
        </svg>
      );
    case "pin":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M12 21s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      );
    case "settings":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" />
        </svg>
      );
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M12 3.5l7 3v5.2c0 4.6-3 7.8-7 9-4-1.2-7-4.4-7-9V6.5l7-3z" />
        </svg>
      );
    case "support":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...s}>
          <path d="M5 18.5l1.8-2.2A7.5 7.5 0 1118.5 12v1.2A7.5 7.5 0 017.8 18L5 18.5z" />
        </svg>
      );
    default:
      return null;
  }
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
    <article className="overflow-hidden rounded-[22px] border border-[var(--account-border)] bg-[var(--bg-elevated)]">
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
          className="absolute top-3 end-3 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-glass)] bg-[var(--bg-glass)] text-[var(--account-plum)] backdrop-blur-sm"
        >
          <AccIcon name="heart" size={15} />
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
          <AddToBagButton size="md" flashAdded className="mt-4" onClick={onAdd} />
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {inStock ? (
            <AddToBagButton
              size="sm"
              flashAdded
              className="w-auto min-w-[9.5rem] flex-1"
              onClick={onAdd}
            />
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
    <section className="rounded-[24px] border border-[var(--account-border)] bg-[var(--bg-elevated)] p-6 sm:p-8">
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
    <section className="grid gap-4 rounded-[22px] border border-[var(--account-border)] bg-[var(--bg-elevated)] p-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.t} className="text-center sm:text-start">
          <p className="text-[0.9rem] font-medium text-[var(--account-plum)]">{item.t}</p>
          <p className="mt-1 text-[0.75rem] text-[var(--account-muted)]">{item.d}</p>
        </div>
      ))}
    </section>
  );
}
