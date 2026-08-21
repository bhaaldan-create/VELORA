"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => {
    const n = search.get("next");
    if (n && n.startsWith("/admin")) return n;
    return "/admin/orders";
  }, [search]);

  const configError = search.get("error") === "config";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "تعذّر تسجيل الدخول.");
      }
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تسجيل الدخول.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-6">
      <div>
        <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
          VELORA ADMIN
        </p>
        <h1 className="font-display t7 mt-2 font-semibold text-[var(--plum)]">
          تسجيل الدخول
        </h1>
        <p className="t3 mt-2 text-[var(--muted)]">
          لوحة الإدارة محمية — للموظفين فقط.
        </p>
      </div>

      {configError ? (
        <div className="t3 border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          أضيفي <span dir="ltr">ADMIN_USERNAME</span> و{" "}
          <span dir="ltr">ADMIN_PASSWORD</span> في{" "}
          <span dir="ltr">.env.local</span> ثم أعيدي تشغيل السيرفر.
        </div>
      ) : null}

      <div>
        <label className="t2 text-[var(--muted)]" htmlFor="admin-username">
          اسم المستخدم
        </label>
        <input
          id="admin-username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="t4 mt-2 w-full border border-[var(--plum)]/20 bg-white px-4 py-3 outline-none focus:border-[var(--plum)]"
          dir="ltr"
          required
        />
      </div>

      <div>
        <label className="t2 text-[var(--muted)]" htmlFor="admin-password">
          كلمة المرور
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="t4 mt-2 w-full border border-[var(--plum)]/20 bg-white px-4 py-3 outline-none focus:border-[var(--plum)]"
          dir="ltr"
          required
        />
      </div>

      {error ? (
        <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "جارٍ التحقق…" : "دخول لوحة الإدارة"}
      </Button>

      <Link
        href="/"
        className="t3 block text-center text-[var(--plum)] underline-offset-4 hover:underline"
      >
        العودة للمتجر
      </Link>
    </form>
  );
}
