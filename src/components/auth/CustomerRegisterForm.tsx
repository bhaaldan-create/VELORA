"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  useCustomerAuth,
  type CustomerPublic,
} from "@/context/CustomerAuthContext";
import {
  iraqMobileError,
  maskIraqMobileInput,
} from "@/lib/phone";
import { validateAuthEmail } from "@/lib/auth-email";

const AUTH_FETCH: RequestInit = { credentials: "include" };

function safeNext(raw: string | null) {
  if (!raw) return "/account";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  if (raw.startsWith("/admin")) return "/account";
  return raw;
}

type Step = "details" | "otp";

export function CustomerRegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { customer, loading, setCustomer } = useCustomerAuth();
  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState<
    string | null
  >(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => safeNext(search.get("next")), [search]);
  const phoneError = phone ? iraqMobileError(phone) : null;

  useEffect(() => {
    if (loading) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as {
          ok?: boolean;
          customer?: CustomerPublic | null;
        };
        if (cancelled) return;
        if (data.customer) {
          setCustomer(data.customer);
          router.replace(nextPath);
          return;
        }
        setCustomer(null);
      } catch {
        if (!cancelled) setCustomer(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, nextPath, router, setCustomer]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function sendOtp() {
    const validated = validateAuthEmail(email);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    const normalizedEmail = validated.email;
    setEmail(normalizedEmail);
    setSubmitting(true);
    setError(null);
    setDevCode(null);
    setOtpHint(null);
    setEmailVerificationToken(null);
    try {
      const res = await fetch("/api/auth/email/send-otp", {
        ...AUTH_FETCH,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          purpose: "register",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        devCode?: string;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "تعذّر إرسال رمز التحقق.");
      }
      if (data.devCode) setDevCode(data.devCode);
      if (data.message) setOtpHint(data.message);
      setEmailVerified(false);
      setOtp("");
      setStep("otp");
      setCooldown(60);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إرسال الرمز.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp() {
    const validated = validateAuthEmail(email);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email/verify-otp", {
        ...AUTH_FETCH,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validated.email, code: otp }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        verificationToken?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "رمز غير صحيح.");
      }
      setEmail(validated.email);
      setEmailVerified(true);
      setEmailVerificationToken(data.verificationToken ?? null);
      setDevCode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر التحقق.");
      setEmailVerified(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function createAccount() {
    const validated = validateAuthEmail(email);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    const err = iraqMobileError(phone);
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        ...AUTH_FETCH,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: validated.email,
          phone,
          password,
          ...(emailVerificationToken
            ? { emailVerificationToken }
            : {}),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok || !data.ok || !data.customer) {
        throw new Error(data.error || "تعذّر إنشاء الحساب.");
      }
      setCustomer(data.customer);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إنشاء الحساب.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === "details") {
      if (!fullName.trim() || !email.trim() || password.length < 8) {
        setError("أكملي جميع الحقول بشكل صحيح.");
        return;
      }
      await sendOtp();
      return;
    }
    if (!emailVerified) {
      await verifyOtp();
      return;
    }
    await createAccount();
  }

  if (loading) {
    return <p className="t3 text-[var(--muted)]">جارٍ تحميل صفحة التسجيل…</p>;
  }

  if (customer) {
    return <p className="t3 text-[var(--muted)]">جارٍ فتح حسابكِ…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-6">
      <div>
        <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
          حسابي
        </p>
        <h1 className="font-display t7 mt-2 font-semibold text-[var(--plum)]">
          إنشاء حساب
        </h1>
        <p className="t3 mt-2 text-[var(--muted)]">
          {step === "details"
            ? "أدخلي بريدكِ الإلكتروني — سيرسل فريق VELORA Beauty رمز التحقق إلى نفس البريد."
            : emailVerified
              ? "تم التحقق من بريدكِ. أدخلي رقم الجوال للتوصيل ثم أنشئي الحساب."
              : `أدخلي رمز التحقق الذي أرسله فريق VELORA إلى ${email}`}
        </p>
      </div>

      {step === "details" ? (
        <>
          <label className="block">
            <span className="t2 text-[var(--muted)]">الاسم الكامل</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
              className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="t2 text-[var(--muted)]">البريد الإلكتروني</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              dir="ltr"
              placeholder="you@example.com"
              className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
            />
            <span className="t2 mt-1 block text-[var(--muted)]">
              رمز التحقق يُرسل إلى هذا البريد فقط
            </span>
          </label>

          <label className="block">
            <span className="t2 text-[var(--muted)]">كلمة المرور</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              dir="ltr"
              className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
            />
            <span className="t2 mt-1 block text-[var(--muted)]">
              8 أحرف على الأقل
            </span>
          </label>
        </>
      ) : (
        <>
          <div className="border border-[var(--plum)]/12 bg-[var(--mist)] px-4 py-3">
            <p className="t3 text-[var(--ink)]/80">
              البريد:{" "}
              <span dir="ltr" className="font-medium text-[var(--plum)]">
                {email}
              </span>
            </p>
            <button
              type="button"
              className="t2 mt-2 text-[var(--plum)] underline-offset-4 hover:underline"
              onClick={() => {
                setStep("details");
                setEmailVerified(false);
                setEmailVerificationToken(null);
                setOtp("");
                setPhone("");
                setDevCode(null);
              }}
            >
              تعديل البيانات
            </button>
          </div>

          {devCode ? (
            <div className="space-y-2">
              {otpHint ? (
                <p className="t2 text-[var(--muted)]">{otpHint}</p>
              ) : null}
              <div className="t3 border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
                رمز التحقق:{" "}
                <span dir="ltr" className="text-lg font-semibold tracking-[0.25em]">
                  {devCode}
                </span>
              </div>
            </div>
          ) : !emailVerified ? (
            <div className="t3 border border-[var(--plum)]/20 bg-[var(--mist)] px-4 py-3 text-[var(--ink)]">
              {otpHint ||
                "تحققي من بريدكِ — الرسالة من فريق VELORA Beauty (وراجعي الرسائل غير المرغوب فيها)."}
            </div>
          ) : null}

          {!emailVerified ? (
            <label className="block">
              <span className="t2 text-[var(--muted)]">رمز التحقق</span>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={submitting}
                placeholder="------"
                dir="ltr"
                className="t4 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 tracking-[0.35em] outline-none focus:border-[var(--plum)] disabled:opacity-60"
              />
            </label>
          ) : (
            <>
              <div className="t3 border border-green-200 bg-green-50 px-4 py-3 text-green-900">
                تم التحقق من البريد ✓
              </div>
              <label className="block">
                <span className="t2 text-[var(--muted)]">
                  رقم الجوال للتوصيل (لا يُستخدم لرمز التحقق)
                </span>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskIraqMobileInput(e.target.value))}
                  disabled={submitting}
                  placeholder="07XXXXXXXXX"
                  dir="ltr"
                  className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
                />
                {phoneError && phone.length >= 11 ? (
                  <span className="t2 mt-1 block text-red-700">{phoneError}</span>
                ) : null}
              </label>
            </>
          )}

          {!emailVerified ? (
            <button
              type="button"
              disabled={submitting || cooldown > 0}
              onClick={() => void sendOtp()}
              className="t2 text-[var(--plum)] underline-offset-4 hover:underline disabled:opacity-40"
            >
              {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown}ث` : "إعادة إرسال الرمز"}
            </button>
          ) : null}
        </>
      )}

      {error ? (
        <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={
          submitting ||
          (step === "otp" &&
            !emailVerified &&
            otp.length !== 6) ||
          (step === "otp" &&
            emailVerified &&
            (Boolean(phoneError) || phone.length < 11))
        }
      >
        {submitting
          ? "جارٍ المعالجة…"
          : step === "details"
            ? "إرسال رمز التحقق إلى البريد"
            : emailVerified
              ? "إنشاء الحساب"
              : "تأكيد الرمز"}
      </Button>

      <p className="t3 text-center text-[var(--muted)]">
        لديكِ حساب؟{" "}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="text-[var(--plum)] underline-offset-4 hover:underline"
        >
          تسجيل الدخول بالبريد
        </Link>
      </p>
    </form>
  );
}
