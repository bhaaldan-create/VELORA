"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authCopy } from "@/components/auth/auth-copy";
import { safeNext } from "@/components/auth/auth-utils";
import { useLocale } from "@/context/LocaleContext";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden>
      <path d="M12.74 9.52c-.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.77-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.84-.81-3.03-.79-1.56.02-3 1.01-3.8 2.56-1.62 2.81-.41 6.97 1.16 9.25.77 1.12 1.69 2.38 2.9 2.33 1.17-.05 1.61-.76 3.02-.76 1.41 0 1.81.76 3.04.74 1.26-.02 2.05-1.14 2.81-2.27.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.44-3.68zM10.5 2.84c.64-.78 1.07-1.86.95-2.94-.92.04-2.03.61-2.69 1.39-.59.68-1.1 1.77-.96 2.81 1.02.08 2.06-.52 2.7-1.26z" />
    </svg>
  );
}

type Status = { google: boolean; apple: boolean };

export function SocialLogin({
  onUnavailable,
  onError,
}: {
  onUnavailable?: (provider: "google" | "apple") => void;
  onError?: (message: string) => void;
}) {
  const { locale } = useLocale();
  const copy = authCopy(locale);
  const search = useSearchParams();
  const nextPath = safeNext(search.get("next"));
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/oauth/status")
      .then((r) => r.json())
      .then((data: { google?: boolean; apple?: boolean }) => {
        if (cancelled) return;
        setStatus({
          google: Boolean(data.google),
          apple: Boolean(data.apple),
        });
      })
      .catch(() => {
        if (!cancelled) setStatus({ google: false, apple: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function start(provider: "google" | "apple") {
    const enabled = status?.[provider];
    if (!status) return;
    if (!enabled) {
      onUnavailable?.(provider);
      onError?.(
        locale === "en"
          ? `${provider === "google" ? "Google" : "Apple"} sign-in is not configured yet.`
          : `${provider === "google" ? "Google" : "Apple"} غير مفعّل بعد — أضيفي المفاتيح في البيئة.`,
      );
      return;
    }
    setLoading(provider);

    // داخل Capacitor: نفس WebView حتى تبقى كوكي الجلسة في التطبيق
    // (فتح Browser منفصل يفصل الجلسة عن WebView على iOS)
    const url = `/api/auth/oauth/${provider}?next=${encodeURIComponent(nextPath)}`;
    window.location.assign(url);
  }

  return (
    <div>
      <div className="auth-divider">{copy.orContinue}</div>
      <div className="flex gap-3">
        <button
          type="button"
          className="auth-social-btn"
          disabled={loading !== null}
          onClick={() => start("google")}
          aria-label="Google"
          aria-busy={loading === "google"}
        >
          {loading === "google" ? (
            <span className="auth-btn-spinner !border-[var(--velora-plum)]/25 !border-t-[var(--velora-plum)]" />
          ) : (
            <>
              <GoogleIcon />
              <span>Google</span>
            </>
          )}
        </button>
        <button
          type="button"
          className="auth-social-btn"
          disabled={loading !== null}
          onClick={() => start("apple")}
          aria-label="Apple"
          aria-busy={loading === "apple"}
        >
          {loading === "apple" ? (
            <span className="auth-btn-spinner !border-[var(--velora-plum)]/25 !border-t-[var(--velora-plum)]" />
          ) : (
            <>
              <AppleIcon />
              <span>Apple</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return <div className="auth-divider">{label}</div>;
}
