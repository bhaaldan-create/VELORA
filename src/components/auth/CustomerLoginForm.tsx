"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  useCustomerAuth,
  type CustomerPublic,
} from "@/context/CustomerAuthContext";

function safeNext(raw: string | null) {
  if (!raw) return "/account";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  if (raw.startsWith("/admin")) return "/account";
  return raw;
}

export function CustomerLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { customer, loading, setCustomer } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        customer?: CustomerPublic;
      };
      if (!res.ok || !data.ok || !data.customer) {
        throw new Error(data.error || "تعذّر تسجيل الدخول.");
      }
      setCustomer(data.customer);
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تسجيل الدخول.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="t3 text-[var(--muted)]">جارٍ التحويل…</p>;
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
          تسجيل الدخول
        </h1>
        <p className="t3 mt-2 text-[var(--muted)]">
          ادخلي لحسابكِ لمتابعة طلباتكِ وإعداداتكِ.
        </p>
      </div>

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
          className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
        />
      </label>

      <label className="block">
        <span className="t2 text-[var(--muted)]">كلمة المرور</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          dir="ltr"
          className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)] disabled:opacity-60"
        />
      </label>

      {error ? (
        <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "جارٍ الدخول…" : "دخول"}
      </Button>

      <p className="t3 text-center text-[var(--muted)]">
        ليس لديكِ حساب؟{" "}
        <Link
          href={`/register?next=${encodeURIComponent(nextPath)}`}
          className="text-[var(--plum)] underline-offset-4 hover:underline"
        >
          إنشاء حساب
        </Link>
      </p>
    </form>
  );
}
