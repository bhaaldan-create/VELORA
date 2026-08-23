"use client";

import { ArrowLeft, Mail, User } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authCopy } from "@/components/auth/auth-copy";
import { AUTH_FETCH, safeNext } from "@/components/auth/auth-utils";
import { AuthButton } from "@/components/auth/AuthButton";
import {
  AuthErrorMessage,
  AuthInfoMessage,
  AuthSuccessMessage,
} from "@/components/auth/AuthMessages";
import { InputField } from "@/components/auth/InputField";
import { OTPInput } from "@/components/auth/OTPInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { PhoneInputField } from "@/components/auth/PhoneInputField";
import { SocialLogin } from "@/components/auth/SocialLogin";
import {
  useCustomerAuth,
  type CustomerPublic,
} from "@/context/CustomerAuthContext";
import { useLocale } from "@/context/LocaleContext";
import { validateAuthEmail } from "@/lib/auth-email";
import {
  iraqMobileError,
  maskIraqMobileInput,
} from "@/lib/phone";

type Step = "details" | "verify";

export function CustomerRegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { customer, loading, setCustomer } = useCustomerAuth();
  const { locale } = useLocale();
  const copy = authCopy(locale);

  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState<
    string | null
  >(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [socialNote, setSocialNote] = useState<string | null>(null);
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
    setEmailVerificationToken(null);
    try {
      const res = await fetch("/api/auth/email/send-otp", {
        ...AUTH_FETCH,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validated.email, purpose: "register" }),
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
      setEmailVerified(false);
      setOtp("");
      setStep("verify");
      setCooldown(60);
    } catch (err) {
      showError(err instanceof Error ? err.message : copy.sending);
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp() {
    const validated = validateAuthEmail(email);
    if (!validated.ok) {
      showError(validated.error);
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
        throw new Error(data.error || copy.confirmOtpCta);
      }
      if (!data.verificationToken) {
        throw new Error(copy.mustVerifyEmail);
      }
      setEmail(validated.email);
      setEmailVerified(true);
      setEmailVerificationToken(data.verificationToken);
      setDevCode(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : copy.confirmOtpCta);
      setEmailVerified(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function createAccount() {
    const validated = validateAuthEmail(email);
    if (!validated.ok) {
      showError(validated.error);
      return;
    }
    const err = iraqMobileError(phone);
    if (err) {
      showError(err);
      return;
    }
    if (!emailVerificationToken) {
      showError(copy.mustVerifyEmail);
      setEmailVerified(false);
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
          emailVerificationToken,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok || !data.ok || !data.customer) {
        throw new Error(data.error || copy.signupCta);
      }
      setCustomer(data.customer);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : copy.signupCta);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === "details") {
      if (!fullName.trim() || !email.trim() || password.length < 8) {
        showError(copy.completeFields);
        return;
      }
      if (confirmPassword && confirmPassword !== password) {
        showError(copy.passwordMismatch);
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
    return <p className="text-center text-[var(--velora-mauve)]">{copy.loading}</p>;
  }

  if (customer) {
    return (
      <p className="text-center text-[var(--velora-mauve)]">{copy.redirecting}</p>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-[var(--velora-plum)]">
            {emailVerified ? copy.verifySuccess : copy.verifyTitle}
          </h2>
          <p className="mt-2 text-[0.9375rem] text-[var(--velora-mauve)]">
            {emailVerified ? copy.verifySuccessPhone : copy.verifySubtitle}
          </p>
          <div className="mt-4 flex justify-center">
            <span className="auth-email-badge">{email}</span>
          </div>
          <button
            type="button"
            className="mt-3 text-[0.8125rem] text-[var(--velora-plum)] underline-offset-4 hover:underline"
            onClick={() => {
              setStep("details");
              setEmailVerified(false);
              setEmailVerificationToken(null);
              setOtp("");
              setPhone("");
              setDevCode(null);
              setError(null);
            }}
          >
            {copy.editDetails}
          </button>
        </div>

        {emailVerified ? (
          <>
            <AuthSuccessMessage message={`${copy.emailVerified} ✓`} />
            <PhoneInputField
              label={copy.phoneLabel}
              hint={copy.phoneHint}
              value={phone}
              onChange={(v) => setPhone(maskIraqMobileInput(v))}
              placeholder={copy.phonePlaceholder}
              disabled={submitting}
              error={phone.length >= 11 ? phoneError : null}
            />
          </>
        ) : (
          <>
            {otpHint ? <AuthInfoMessage message={otpHint} /> : null}
            {devCode ? (
              <AuthInfoMessage message={`${copy.devCode} ${devCode}`} />
            ) : (
              <AuthInfoMessage message={copy.checkInbox} />
            )}
            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={submitting}
              autoFocus
            />
            <div className="flex justify-center">
              <button
                type="button"
                disabled={submitting || cooldown > 0}
                onClick={() => void sendOtp()}
                className="text-[0.875rem] text-[var(--velora-plum)] underline-offset-4 hover:underline disabled:opacity-40"
              >
                {cooldown > 0 ? copy.resendIn(cooldown) : copy.resend}
              </button>
            </div>
          </>
        )}

        {error ? <AuthErrorMessage message={error} shake={shake} /> : null}

        <AuthButton
          loading={submitting}
          disabled={
            !emailVerified
              ? otp.length !== 6
              : Boolean(phoneError) || phone.length < 11
          }
          trailing={
            <ArrowLeft size={18} className="opacity-80 rtl:rotate-180" aria-hidden />
          }
        >
          {submitting
            ? copy.processing
            : emailVerified
              ? copy.signupCta
              : copy.confirmOtpCta}
        </AuthButton>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <InputField
        label={copy.fullName}
        type="text"
        autoComplete="name"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder={copy.fullNamePlaceholder}
        disabled={submitting}
        icon={<User size={18} aria-hidden />}
      />

      <InputField
        label={copy.email}
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={copy.emailPlaceholder}
        disabled={submitting}
        hint={copy.otpOnlyHint}
        dir="ltr"
        icon={<Mail size={18} aria-hidden />}
      />

      <div>
        <PasswordInput
          label={copy.password}
          value={password}
          onChange={setPassword}
          placeholder={copy.passwordPlaceholder}
          autoComplete="new-password"
          disabled={submitting}
          hint={copy.passwordMin}
        />
        <PasswordStrength password={password} locale={locale} />
      </div>

      <PasswordInput
        label={copy.confirmPassword}
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder={copy.confirmPasswordPlaceholder}
        autoComplete="new-password"
        disabled={submitting}
        id="auth-confirm-password"
      />

      {socialNote ? <AuthInfoMessage message={socialNote} /> : null}
      {error ? <AuthErrorMessage message={error} shake={shake} /> : null}

      <AuthButton
        loading={submitting}
        trailing={
          <ArrowLeft size={18} className="opacity-80 rtl:rotate-180" aria-hidden />
        }
      >
        {submitting ? copy.sending : copy.sendOtpCta}
      </AuthButton>

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
