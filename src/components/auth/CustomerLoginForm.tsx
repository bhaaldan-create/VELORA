"use client";

import { ArrowLeft, Mail } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authCopy } from "@/components/auth/auth-copy";
import { AUTH_FETCH, safeNext } from "@/components/auth/auth-utils";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import {
  AuthErrorMessage,
  AuthInfoMessage,
} from "@/components/auth/AuthMessages";
import { InputField } from "@/components/auth/InputField";
import { OTPInput } from "@/components/auth/OTPInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SocialLogin } from "@/components/auth/SocialLogin";
import {
  useCustomerAuth,
  type CustomerPublic,
} from "@/context/CustomerAuthContext";
import { useLocale } from "@/context/LocaleContext";
import { validateAuthEmail } from "@/lib/auth-email";

const REMEMBER_KEY = "velora_remember_email";

type LoginMode = "password" | "otp-email" | "otp-code";

export function CustomerLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { customer, loading, setCustomer } = useCustomerAuth();
  const { locale } = useLocale();
  const copy = authCopy(locale);

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [socialNote, setSocialNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => safeNext(search.get("next")), [search]);

  useEffect(() => {
    const oauthError = search.get("oauth_error");
    if (oauthError) {
      setError(oauthError);
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
    }
  }, [search]);

  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

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

  function showError(message: string) {
    setError(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  }

  async function sendOtp() {
    const validated = validateAuthEmail(email);
    if (!validated.ok) {
      showError(validated.error);
      return;
    }
    setEmail(validated.email);
    setSubmitting(true);
    setError(null);
    setDevCode(null);
    setOtpHint(null);
    try {
      const res = await fetch("/api/auth/email/send-otp", {
        ...AUTH_FETCH,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validated.email, purpose: "login" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        devCode?: string;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || copy.sending);
      }
      if (data.devCode) setDevCode(data.devCode);
      if (data.message) setOtpHint(data.message);
      setOtp("");
      setMode("otp-code");
      setCooldown(60);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function loginWithPassword() {
    const validated = validateAuthEmail(email);
    if (!validated.ok) {
      showError(validated.error);
      return;
    }
    if (!password) {
      showError(copy.passwordPlaceholder);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        ...AUTH_FETCH,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validated.email, password }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok || !data.ok || !data.customer) {
        throw new Error(data.error || copy.loginCta);
      }
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, validated.email);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
      setCustomer(data.customer);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function loginWithOtp() {
    const validated = validateAuthEmail(email);
    if (!validated.ok) {
      showError(validated.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login/email", {
        ...AUTH_FETCH,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validated.email, code: otp }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok || !data.ok || !data.customer) {
        throw new Error(data.error || copy.confirmLoginCta);
      }
      setCustomer(data.customer);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "password") {
      await loginWithPassword();
      return;
    }
    if (mode === "otp-email") {
      await sendOtp();
      return;
    }
    await loginWithOtp();
  }

  if (loading) {
    return <p className="text-center text-[var(--velora-mauve)]">{copy.loading}</p>;
  }

  if (customer) {
    return (
      <p className="text-center text-[var(--velora-mauve)]">{copy.redirecting}</p>
    );
  }

  if (mode === "otp-code") {
    return (
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-[var(--velora-plum)]">
            {copy.verifyTitle}
          </h2>
          <p className="mt-2 text-[0.9375rem] text-[var(--velora-mauve)]">
            {copy.verifySubtitle}
          </p>
          <div className="mt-4 flex justify-center">
            <span className="auth-email-badge">{email}</span>
          </div>
        </div>

        {otpHint ? <AuthInfoMessage message={otpHint} /> : null}
        {devCode ? (
          <AuthInfoMessage message={`${copy.devCode} ${devCode}`} />
        ) : null}
        {error ? <AuthErrorMessage message={error} shake={shake} /> : null}

        <OTPInput
          value={otp}
          onChange={setOtp}
          disabled={submitting}
          autoFocus
        />

        <AuthButton
          loading={submitting}
          disabled={otp.length !== 6}
          trailing={
            <ArrowLeft size={18} className="opacity-80 rtl:rotate-180" aria-hidden />
          }
        >
          {submitting ? copy.signingIn : copy.confirmLoginCta}
        </AuthButton>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[0.875rem]">
          <button
            type="button"
            disabled={submitting || cooldown > 0}
            onClick={() => void sendOtp()}
            className="text-[var(--velora-plum)] underline-offset-4 hover:underline disabled:opacity-40"
          >
            {cooldown > 0 ? copy.resendIn(cooldown) : copy.resend}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setMode("otp-email");
              setOtp("");
              setError(null);
            }}
            className="text-[var(--velora-mauve)] underline-offset-4 hover:underline"
          >
            {copy.changeEmail}
          </button>
        </div>
      </form>
    );
  }

  if (mode === "otp-email") {
    return (
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthInfoMessage message={copy.checkInbox} />
        <InputField
          label={copy.email}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.emailPlaceholder}
          disabled={submitting}
          dir="ltr"
          icon={<Mail size={18} aria-hidden />}
        />
        {error ? <AuthErrorMessage message={error} shake={shake} /> : null}
        <AuthButton
          loading={submitting}
          trailing={
            <ArrowLeft size={18} className="opacity-80 rtl:rotate-180" aria-hidden />
          }
        >
          {submitting ? copy.sending : copy.sendOtpCta}
        </AuthButton>
        <button
          type="button"
          className="w-full text-center text-[0.875rem] text-[var(--velora-mauve)] underline-offset-4 hover:underline"
          onClick={() => {
            setMode("password");
            setError(null);
          }}
        >
          {copy.passwordLoginLink}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <InputField
        label={copy.email}
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={copy.emailPlaceholder}
        disabled={submitting}
        dir="ltr"
        icon={<Mail size={18} aria-hidden />}
      />

      <PasswordInput
        label={copy.password}
        value={password}
        onChange={setPassword}
        placeholder={copy.passwordPlaceholder}
        autoComplete="current-password"
        disabled={submitting}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AuthCheckbox
          checked={remember}
          onChange={setRemember}
          label={copy.rememberMe}
          disabled={submitting}
        />
        <button
          type="button"
          className="text-[0.875rem] text-[var(--velora-plum)] underline-offset-4 hover:underline"
          onClick={() => setSocialNote(copy.forgotPasswordHint)}
        >
          {copy.forgotPassword}
        </button>
      </div>

      {socialNote ? <AuthInfoMessage message={socialNote} /> : null}
      {error ? <AuthErrorMessage message={error} shake={shake} /> : null}

      <AuthButton
        loading={submitting}
        trailing={
          <ArrowLeft size={18} className="opacity-80 rtl:rotate-180" aria-hidden />
        }
      >
        {submitting ? copy.signingIn : copy.loginCta}
      </AuthButton>

      <button
        type="button"
        className="w-full text-center text-[0.875rem] text-[var(--velora-mauve)] underline-offset-4 hover:underline"
        onClick={() => {
          setMode("otp-email");
          setError(null);
        }}
      >
        {copy.otpLoginLink}
      </button>

      <SocialLogin
        onUnavailable={() =>
          setSocialNote(
            locale === "en"
              ? "Add OAuth keys in environment to enable social sign-in."
              : "أضيفي مفاتيح OAuth في إعدادات البيئة لتفعيل الدخول الاجتماعي.",
          )
        }
        onError={(message) => setSocialNote(message)}
      />
    </form>
  );
}
