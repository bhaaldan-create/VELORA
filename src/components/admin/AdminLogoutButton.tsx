"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={busy}
      className="t3 text-[var(--plum)] underline-offset-4 hover:underline disabled:opacity-50"
    >
      {busy ? "جارٍ الخروج…" : "تسجيل الخروج"}
    </button>
  );
}
