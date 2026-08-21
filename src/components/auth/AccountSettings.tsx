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
import { Button } from "@/components/ui/Button";
import { formatIraqMobileLocal } from "@/lib/phone";
import {
  useCustomerAuth,
  type CustomerPublic,
} from "@/context/CustomerAuthContext";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

type AccountSection =
  | "overview"
  | "profile"
  | "orders"
  | "appearance"
  | "security"
  | "help";

const SECTIONS: {
  id: AccountSection;
  label: string;
  hint: string;
}[] = [
  { id: "overview", label: "نظرة عامة", hint: "ملخص حسابكِ" },
  { id: "profile", label: "معلوماتي", hint: "البيانات الشخصية" },
  { id: "orders", label: "طلباتي", hint: "تتبع الطلبات" },
  { id: "appearance", label: "المظهر", hint: "نهاري / ليلي" },
  { id: "security", label: "الأمان", hint: "كلمة المرور" },
  { id: "help", label: "المساعدة", hint: "رعاية العميلة" },
];

function isSection(value: string | null): value is AccountSection {
  return SECTIONS.some((s) => s.id === value);
}

export function AccountSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer, loading, setCustomer, logout } = useCustomerAuth();
  const { theme, setTheme } = useTheme();

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

  const [orderId, setOrderId] = useState("");
  const [myOrders, setMyOrders] = useState<
    {
      orderId: string;
      savedAt: string;
      statusLabel: string;
      totalLabel: string;
      itemCount: number;
      paymentMethodLabel: string;
    }[]
  >([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

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
    if (section !== "orders" || !customer) return;
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(null);
    void (async () => {
      try {
        const res = await fetch("/api/auth/orders", { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          orders?: typeof myOrders;
        };
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "تعذّر جلب الطلبات.");
        }
        if (!cancelled) setMyOrders(data.orders || []);
      } catch (err) {
        if (!cancelled) {
          setOrdersError(
            err instanceof Error ? err.message : "تعذّر جلب الطلبات.",
          );
        }
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [section, customer]);

  function goTo(next: AccountSection) {
    router.replace(next === "overview" ? "/account" : `/account?section=${next}`);
  }

  if (loading || !customer) {
    return (
      <p className="t3 text-[var(--muted)]">جارٍ تحميل حسابكِ…</p>
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
        throw new Error(data.error || "تعذّر الحفظ.");
      }
      setCustomer(data.customer);
      setProfileMessage("تم حفظ معلوماتكِ.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "تعذّر الحفظ.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setSecurityError(null);
    setSecurityMessage(null);
    if (newPassword !== confirmPassword) {
      setSecurityError("تأكيد كلمة المرور غير متطابق.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "تعذّر تغيير كلمة المرور.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSecurityMessage("تم تحديث كلمة المرور بنجاح.");
    } catch (err) {
      setSecurityError(
        err instanceof Error ? err.message : "تعذّر تغيير كلمة المرور.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  function trackOrder(e: FormEvent) {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) return;
    router.push(`/track/${encodeURIComponent(id)}`);
  }

  const firstName = customer.fullName.trim().split(/\s+/)[0] || customer.fullName;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="mb-6">
          <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
            حسابي
          </p>
          <h1 className="font-display t6 mt-2 font-semibold text-[var(--plum)]">
            {firstName}
          </h1>
          <p className="t2 mt-1 truncate text-[var(--muted)]" dir="ltr">
            {customer.email}
          </p>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label="أقسام الحساب"
        >
          {SECTIONS.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(item.id)}
                className={cn(
                  "t3 shrink-0 px-4 py-3 text-start transition-colors duration-300 lg:w-full",
                  active
                    ? "bg-[var(--mist)] text-[var(--ink)]"
                    : "text-[var(--muted)] hover:bg-[var(--mist)]/60 hover:text-[var(--ink)]",
                )}
              >
                <span className="block font-medium">{item.label}</span>
                <span className="t1 mt-0.5 hidden text-[var(--muted)] lg:block">
                  {item.hint}
                </span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="t3 mt-4 hidden w-full border-t border-[var(--plum)]/10 pt-4 text-start text-[var(--muted)] transition-colors hover:text-[var(--plum)] lg:block"
        >
          تسجيل الخروج
        </button>
      </aside>

      <div className="min-w-0 animate-[velora-fade_0.45s_ease]">
        {section === "overview" ? (
          <OverviewPanel
            customer={customer}
            theme={theme}
            onNavigate={goTo}
            onLogout={() => void onLogout()}
          />
        ) : null}

        {section === "profile" ? (
          <Panel
            title="معلوماتي"
            subtitle="بياناتكِ الشخصية وعنوان التوصيل الافتراضي."
          >
            <form onSubmit={onSaveProfile} className="space-y-7">
              <ReadOnlyField
                label="البريد الإلكتروني"
                value={customer.email}
                ltr
              />
              <label className="block">
                <span className="t2 text-[var(--muted)]">الاسم الكامل</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={savingProfile}
                  className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
                />
              </label>
              <div>
                <ReadOnlyField
                  label="رقم الجوال (موثّق)"
                  value={formatIraqMobileLocal(customer.phone)}
                  ltr
                />
                <p className="t2 mt-2 text-[var(--muted)]">
                  لتغيير الرقم لاحقاً سيلزم رمز تحقق جديد عبر واتساب.
                </p>
              </div>
              <label className="block">
                <span className="t2 text-[var(--muted)]">العنوان الافتراضي</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  disabled={savingProfile}
                  placeholder="يُستخدم لتسهيل إتمام الطلب"
                  className="t3 mt-2 w-full resize-y border border-[var(--plum)]/12 bg-transparent px-3 py-3 outline-none focus:border-[var(--plum)]/35 disabled:opacity-60"
                />
              </label>
              {profileError ? <Alert tone="error">{profileError}</Alert> : null}
              {profileMessage ? (
                <Alert tone="success">{profileMessage}</Alert>
              ) : null}
              <div className="flex flex-wrap gap-3 pt-1">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? "جارٍ الحفظ…" : "حفظ المعلومات"}
                </Button>
                <Link href="/shop">
                  <Button type="button" variant="ghost">
                    متابعة التسوق
                  </Button>
                </Link>
              </div>
            </form>
          </Panel>
        ) : null}

        {section === "orders" ? (
          <Panel
            title="طلباتي"
            subtitle="طلباتكِ المرتبطة بالحساب، مع إمكانية التتبع برقم الطلب."
          >
            <div className="space-y-4">
              {ordersLoading ? (
                <p className="t3 text-[var(--muted)]">جارٍ تحميل طلباتكِ…</p>
              ) : null}
              {ordersError ? <Alert tone="error">{ordersError}</Alert> : null}
              {!ordersLoading && !ordersError && myOrders.length === 0 ? (
                <p className="t3 text-[var(--muted)]">
                  لا توجد طلبات بعد على هذا الحساب.
                </p>
              ) : null}
              {myOrders.map((entry) => (
                <Link
                  key={entry.orderId}
                  href={`/track/${encodeURIComponent(entry.orderId)}`}
                  className="block border border-[var(--plum)]/10 bg-[var(--mist)]/40 px-4 py-4 transition-colors hover:border-[var(--plum)]/25"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="t3 font-medium text-[var(--ink)]" dir="ltr">
                      #{entry.orderId}
                    </p>
                    <p className="t2 text-[var(--plum)]">{entry.statusLabel}</p>
                  </div>
                  <p className="t2 mt-2 text-[var(--muted)]">
                    {entry.itemCount} منتج · {entry.totalLabel} ·{" "}
                    {entry.paymentMethodLabel}
                  </p>
                  <p className="t1 mt-1 text-[var(--muted)]">
                    {new Date(entry.savedAt).toLocaleString("ar-IQ")}
                  </p>
                </Link>
              ))}
            </div>

            <form onSubmit={trackOrder} className="mt-8 space-y-5 border-t border-[var(--plum)]/10 pt-8">
              <label className="block">
                <span className="t2 text-[var(--muted)]">تتبع برقم طلب</span>
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="إن كان لديكِ رقم طلب"
                  dir="ltr"
                  className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 text-start outline-none focus:border-[var(--plum)]"
                />
              </label>
              <Button type="submit" disabled={!orderId.trim()}>
                تتبع الطلب
              </Button>
            </form>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <QuickLink href="/cart" title="الحقيبة" desc="مراجعة المنتجات قبل الطلب" />
              <QuickLink href="/shop" title="التسوق" desc="استكشفي مجموعة VELORA" />
            </div>
          </Panel>
        ) : null}

        {section === "appearance" ? (
          <Panel
            title="المظهر"
            subtitle="اختاري المظهر النهاري أو الليلي لواجهة المتجر."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ThemeChoice
                active={theme === "light"}
                title="نهاري"
                desc="خلفية فاتحة دافئة تناسب التسوق نهاراً"
                onClick={() => setTheme("light")}
                preview="light"
              />
              <ThemeChoice
                active={theme === "dark"}
                title="ليلي"
                desc="مظهر هادئ بدرجات عميقة مريحة للعين"
                onClick={() => setTheme("dark")}
                preview="dark"
              />
            </div>
            <p className="t2 mt-6 text-[var(--muted)]">
              يُحفظ اختياركِ على هذا الجهاز ويُطبَّق على كامل الموقع.
            </p>
          </Panel>
        ) : null}

        {section === "security" ? (
          <Panel
            title="الأمان"
            subtitle="حدّثي كلمة المرور للحفاظ على أمان حسابكِ."
          >
            <form onSubmit={onChangePassword} className="space-y-6">
              <label className="block">
                <span className="t2 text-[var(--muted)]">كلمة المرور الحالية</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={savingPassword}
                  className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
                />
              </label>
              <label className="block">
                <span className="t2 text-[var(--muted)]">كلمة المرور الجديدة</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={savingPassword}
                  className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
                />
              </label>
              <label className="block">
                <span className="t2 text-[var(--muted)]">تأكيد كلمة المرور</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={savingPassword}
                  className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
                />
              </label>
              {securityError ? <Alert tone="error">{securityError}</Alert> : null}
              {securityMessage ? (
                <Alert tone="success">{securityMessage}</Alert>
              ) : null}
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "جارٍ التحديث…" : "تحديث كلمة المرور"}
              </Button>
            </form>
          </Panel>
        ) : null}

        {section === "help" ? (
          <Panel
            title="المساعدة"
            subtitle="فريق رعاية العميلة جاهز لمساعدتكِ."
          >
            <div className="grid gap-3">
              <QuickLink
                href="/advisor"
                title="المستشارة لارسا"
                desc="نصيحة مخصّصة وبحث عن المنتجات"
              />
              <a
                href="https://wa.me/9647830000492"
                target="_blank"
                rel="noreferrer"
                className="block border border-[var(--plum)]/10 bg-[var(--mist)]/50 px-5 py-4 transition-colors hover:border-[var(--plum)]/25"
              >
                <p className="t3 font-medium text-[var(--ink)]">واتساب الشركة</p>
                <p className="t2 mt-1 text-[var(--muted)]" dir="ltr">
                  07830000492
                </p>
              </a>
              <a
                href="mailto:care@velora.beauty"
                className="block border border-[var(--plum)]/10 bg-[var(--mist)]/50 px-5 py-4 transition-colors hover:border-[var(--plum)]/25"
              >
                <p className="t3 font-medium text-[var(--ink)]">البريد</p>
                <p className="t2 mt-1 text-[var(--muted)]" dir="ltr">
                  care@velora.beauty
                </p>
              </a>
            </div>
          </Panel>
        ) : null}

        <button
          type="button"
          onClick={() => void onLogout()}
          className="t3 mt-8 w-full border-t border-[var(--plum)]/10 pt-5 text-[var(--muted)] transition-colors hover:text-[var(--plum)] lg:hidden"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

function OverviewPanel({
  customer,
  theme,
  onNavigate,
  onLogout,
}: {
  customer: CustomerPublic;
  theme: ThemeMode;
  onNavigate: (s: AccountSection) => void;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display t6 font-semibold text-[var(--plum)]">
          مرحباً بكِ
        </h2>
        <p className="t3 mt-2 max-w-xl text-[var(--muted)]">
          أديري معلوماتكِ، تتبّعي طلباتكِ، وخصّصي مظهر المتجر من مكان واحد.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <OverviewTile
          title="معلوماتي"
          desc={`${customer.fullName} · ${formatIraqMobileLocal(customer.phone)}`}
          onClick={() => onNavigate("profile")}
        />
        <OverviewTile
          title="طلباتي"
          desc="تتبع الطلب برقم الطلب"
          onClick={() => onNavigate("orders")}
        />
        <OverviewTile
          title="المظهر"
          desc={theme === "dark" ? "الوضع الليلي مفعّل" : "الوضع النهاري مفعّل"}
          onClick={() => onNavigate("appearance")}
        />
        <OverviewTile
          title="الأمان"
          desc="تغيير كلمة المرور"
          onClick={() => onNavigate("security")}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--plum)]/10 pt-6">
        <button
          type="button"
          onClick={() => onNavigate("help")}
          className="t3 text-[var(--plum)] underline-offset-4 hover:underline"
        >
          تحتاجين مساعدة؟
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="t3 text-[var(--muted)] underline-offset-4 hover:text-[var(--plum)] hover:underline"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display t6 font-semibold text-[var(--plum)]">
        {title}
      </h2>
      <p className="t3 mt-2 text-[var(--muted)]">{subtitle}</p>
      <div className="mt-8 border border-[var(--plum)]/10 bg-[var(--surface)] p-6 sm:p-8">
        {children}
      </div>
    </section>
  );
}

function ReadOnlyField({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div>
      <span className="t2 text-[var(--muted)]">{label}</span>
      <p
        className="t3 mt-2 text-[var(--ink)]"
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "t3 border px-4 py-3",
        tone === "error"
          ? "border-red-300/50 bg-[color-mix(in_srgb,red_8%,var(--surface))] text-red-800"
          : "border-emerald-300/50 bg-[color-mix(in_srgb,emerald_10%,var(--surface))] text-emerald-900",
      )}
    >
      {children}
    </div>
  );
}

function OverviewTile({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-[var(--plum)]/10 bg-[var(--surface)] px-5 py-5 text-start transition-all duration-300 hover:border-[var(--plum)]/25 hover:bg-[var(--mist)]"
    >
      <p className="t3 font-medium text-[var(--ink)]">{title}</p>
      <p className="t2 mt-2 line-clamp-2 text-[var(--muted)]">{desc}</p>
    </button>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-[var(--plum)]/10 bg-[var(--mist)]/50 px-5 py-4 transition-colors hover:border-[var(--plum)]/25"
    >
      <p className="t3 font-medium text-[var(--ink)]">{title}</p>
      <p className="t2 mt-1 text-[var(--muted)]">{desc}</p>
    </Link>
  );
}

function ThemeChoice({
  active,
  title,
  desc,
  onClick,
  preview,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
  preview: ThemeMode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "border px-5 py-5 text-start transition-all duration-300",
        active
          ? "border-[var(--plum)]/40 bg-[var(--mist)]"
          : "border-[var(--plum)]/10 bg-[var(--surface)] hover:border-[var(--plum)]/25",
      )}
    >
      <div
        className={cn(
          "mb-4 h-16 w-full border border-[var(--plum)]/10",
          preview === "light"
            ? "bg-[#f8f4f1]"
            : "bg-[#141114]",
        )}
        aria-hidden
      >
        <div
          className={cn(
            "m-3 h-3 w-1/2",
            preview === "light" ? "bg-[#3d2640]/70" : "bg-[#e2d2d5]/70",
          )}
        />
        <div
          className={cn(
            "mx-3 h-2 w-2/3",
            preview === "light" ? "bg-[#8b7a84]/40" : "bg-[#9a8a92]/40",
          )}
        />
      </div>
      <p className="t3 font-medium text-[var(--ink)]">{title}</p>
      <p className="t2 mt-1 text-[var(--muted)]">{desc}</p>
      {active ? (
        <p className="t1 mt-3 tracking-[0.12em] text-[var(--plum)]">مفعّل</p>
      ) : null}
    </button>
  );
}
