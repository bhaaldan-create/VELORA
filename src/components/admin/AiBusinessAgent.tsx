"use client";

import { useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";

type Msg = { role: "user" | "assistant"; text: string };

export function AiBusinessAgent() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "أنا وكيل أعمال VELORA. أسأليني عن المبيعات، الربح، المخزون، الموردين أو نقطة التعادل — أعتمد فقط على أرقام قاعدة البيانات.",
    },
  ]);

  async function ask() {
    if (!q.trim() || busy) return;
    const question = q.trim();
    setQ("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: json.answerAr || json.error || "تعذّر الرد",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="وكيل أعمال VELORA الذكي"
        description="تحليل وتوصيات من بيانات حقيقية — بدون اختراع أرقام."
      />
      <Surface className="flex min-h-[420px] flex-col p-4">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "ms-auto bg-[var(--admin-accent)] text-white"
                  : "bg-[var(--admin-surface-2)] text-[var(--admin-text)]"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-2.5 text-[13px]"
            placeholder="مثال: كم بعنا هذا الشهر؟ وأي علامة أكثر ربحاً؟"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void ask();
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void ask()}
            className="rounded-full bg-[var(--admin-accent)] px-5 text-[12px] text-white disabled:opacity-50"
          >
            {busy ? "…" : "اسألي"}
          </button>
        </div>
      </Surface>
    </div>
  );
}
