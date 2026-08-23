"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "@/components/admin/ui/icons";

export function AdminLogoutButton({
  compact = false,
}: {
  compact?: boolean;
}) {
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
      className={`inline-flex items-center gap-2 rounded-[8px] text-[12px] text-[var(--admin-text-secondary)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)] disabled:opacity-50 ${
        compact ? "size-9 justify-center" : "w-full px-2.5 py-2"
      }`}
    >
      <LogOut className="size-3.5" strokeWidth={1.6} />
      {!compact ? (busy ? "جارٍ الخروج…" : "تسجيل الخروج") : null}
    </button>
  );
}
