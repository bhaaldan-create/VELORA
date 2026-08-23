"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  useCustomerAuth,
  type CustomerPublic,
} from "@/context/CustomerAuthContext";
import { useLocale } from "@/context/LocaleContext";

function safeNext(raw: string | null) {
  if (!raw) return "/account";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  if (raw.startsWith("/admin")) return "/account";
  return raw;
}

type Step = "email" | "otp";

export function CustomerLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { customer, loading, setCustomer } = useCustomerAuth();
  const { locale } = useLocale();
  const ar = locale !== "en";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => safeNext(search.get("next")), [search]);

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
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setError(ar ? "أدخلي بريداً إلكترونياً صالحاً." : "Enter a valid email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setDevCode(null);
    setOtpHint(null);
    try {
      const res = await fetch("/api/auth/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, purpose: "login" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        devCode?: string;
        message?: string;
        channel?: "email" | "dev";
      };
      if (!res.ok || !data.ok) {
        throw new Error(
          data.error ||
            (ar ? "تعذّر إرسال رمز التحقق." : "Could not send the code."),
        );
      }
      if (data.devCode) setDevCode(data.devCode);
      if (data.message) setOtpHint(data.message);
      setOtp("");
      setStep("otp");
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function loginWithOtp() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otp,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok || !data.ok || !data.customer) {
        throw new Error(
          data.error || (ar ? "تعذّر تسجيل الدخول." : "Could not sign in."),
        );
      }
      setCustomer(data.customer);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === "email") {
      await sendOtp();
      return;
    }
    await loginWithOtp();
  }

  if (loading) {
    return (
      <p className="t3 text-[var(--muted)]">
        {ar ? "جارٍ التحويل…" : "Redirecting…"}
      </p>
    );
  }

  if (customer) {
    return (
      <p className="t3 text-[var(--muted)]">
        {ar ? "جارٍ فتح حسابكِ…" : "Opening your account…"}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-6">
      <div>
        <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
          {ar ? "حسابي" : "Account"}
        </p>
        <h1 className="font-display t7 mt-2 font-semibold text-[var(--plum)]">
          {ar ? "تسجيل الدخول" : "Sign in"}
        </h1>
        <p className="t3 mt-2 text-[var(--muted)]">
          {step === "email"
            ? ar
              ? "أدخلي بريدكِ الإلكتروني — سيرسل فريق VELORA Beauty رمز التحقق إلى نفس البريد."
              : "Enter your email — the VELORA Beauty team will send a code to that address."
            : ar
              ? `أدخلي الرمز الذي أرسله فريق VELORA إلى ${email}`
              : `Enter the code the VELORA team sent to ${email}`}
        </p>
      </div>

      {step === "email" ? (
        <label className="block">
          <span className="t2 text-[var(--muted)]">
            {ar ? "البريد الإلكتروني" : "Email"}
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            dir="ltr"
            className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
          />
        </label>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="t2 text-[var(--muted)]">
              {ar ? "رمز التحقق" : "Verification code"}
            </span>
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={submitting}
              dir="ltr"
              placeholder="••••••"
              className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 tracking-[0.35em] outline-none focus:border-[var(--plum)] disabled:opacity-60"
            />
          </label>

          {otpHint ? (
            <p className="t2 text-[var(--muted)]">{otpHint}</p>
          ) : (
            <p className="t2 text-[var(--muted)]">
              {ar
                ? "تحققي من بريدكِ — الرسالة من فريق VELORA Beauty."
                : "Check your inbox — look for a message from the VELORA Beauty team."}
            </p>
          )}
          {devCode ? (
            <p className="t2 rounded-xl border border-[var(--plum)]/15 bg-[var(--mist)] px-3 py-2 text-[var(--plum)]">
              {ar ? "رمز مؤقت:" : "Dev code:"}{" "}
              <span className="font-latin tracking-widest" dir="ltr">
                {devCode}
              </span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={submitting || cooldown > 0}
              onClick={() => void sendOtp()}
              className="t2 text-[var(--plum)] underline-offset-4 hover:underline disabled:opacity-40"
            >
              {cooldown > 0
                ? ar
                  ? `إعادة الإرسال بعد ${cooldown}ث`
                  : `Resend in ${cooldown}s`
                : ar
                  ? "إعادة إرسال الرمز"
                  : "Resend code"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
                setDevCode(null);
              }}
              className="t2 text-[var(--muted)] underline-offset-4 hover:underline"
            >
              {ar ? "تغيير البريد" : "Change email"}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={submitting || (step === "otp" && otp.length !== 6)}
      >
        {submitting
          ? step === "email"
            ? ar
              ? "جارٍ الإرسال…"
              : "Sending…"
            : ar
              ? "جارٍ الدخول…"
              : "Signing in…"
          : step === "email"
            ? ar
              ? "إرسال رمز التحقق إلى البريد"
              : "Send code to email"
            : ar
              ? "تأكيد الدخول"
              : "Confirm sign in"}
      </Button>

      <p className="t3 text-center text-[var(--muted)]">
        {ar ? "ليس لديكِ حساب؟" : "Don’t have an account?"}{" "}
        <Link
          href={`/register?next=${encodeURIComponent(nextPath)}`}
          className="text-[var(--plum)] underline-offset-4 hover:underline"
        >
          {ar ? "إنشاء حساب" : "Create account"}
        </Link>
      </p>
    </form>
  );
}
