"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { advisorStarters } from "@/data/advisor-starters";
import { Button } from "@/components/ui/Button";
import { ui } from "@/constants/brand";
import {
  ProductRecommendationCards,
  collectRecommendationsFromMessages,
  type RecommendedProduct,
} from "@/components/advisor/ProductRecommendationCards";

type ProviderInfo = {
  provider: "openai" | "google" | "local";
  aiEnabled: boolean;
  label: string;
};

export function AdvisorChat() {
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/advisor" }),
    [],
  );

  const { messages, sendMessage, status, error, clearError, stop } = useChat({
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    fetch("/api/advisor")
      .then((r) => r.json())
      .then((data: ProviderInfo) => setProvider(data))
      .catch(() =>
        setProvider({
          provider: "local",
          aiEnabled: false,
          label: "مستشارة VELORA المحلية",
        }),
      );
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const sidebarRecs = collectRecommendationsFromMessages(messages);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    clearError();
    setInput("");
    void sendMessage({ text: trimmed });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:py-16">
      <div className="flex min-h-[72vh] flex-col border border-[var(--plum)]/10 bg-[var(--ivory)]">
        <div className="border-b border-[var(--plum)]/10 px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
                {ui.clientCare}
              </p>
              <h1 className="font-display t7 mt-2 font-semibold text-[var(--plum)]">
                {ui.advisor}
              </h1>
              <p className="t3 mt-2 max-w-xl text-[var(--ink)]/65">
                ذكاء اصطناعي يساعدكِ ويختار منتجات من متجر VELORA فقط — بالدينار العراقي.
              </p>
            </div>
            {provider ? (
              <span
                className={`t1 px-3 py-1.5 font-medium ${
                  provider.aiEnabled
                    ? "bg-[var(--plum)] text-[var(--ivory)]"
                    : "bg-[var(--mist)] text-[var(--plum)]"
                }`}
              >
                {provider.aiEnabled ? `AI · ${provider.label}` : "وضع المستشارة الذكية"}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6 sm:px-8">
          {messages.length === 0 ? (
            <div className="max-w-[92%] bg-[var(--mist)] px-4 py-3">
              <p className="t3 text-[var(--ink)]/85">
                أهلاً بكِ في VELORA. أنا المستشارة لارسا. ابحثي أو صفي بشرتكِ وهدفكِ —
                ترطيب، إشراقة، حبوب، شعر، أو مكياج — وسأقترح منتجات من مجموعتنا مع روتين عملي.
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {message.parts.map((part, index) => {
                if (part.type === "text" && part.text?.trim()) {
                  return (
                    <div
                      key={`${message.id}-t-${index}`}
                      className={
                        message.role === "user"
                          ? "t3 ms-auto max-w-[85%] whitespace-pre-wrap bg-[var(--plum)] px-4 py-3 text-[var(--ivory)]"
                          : "t3 max-w-[92%] whitespace-pre-wrap bg-[var(--mist)] px-4 py-3 text-[var(--ink)]/85"
                      }
                    >
                      {part.text}
                    </div>
                  );
                }

                if (part.type === "tool-recommendProducts") {
                  if (part.state === "input-streaming" || part.state === "input-available") {
                    return (
                      <p
                        key={`${message.id}-tool-${index}`}
                        className="t2 text-[var(--muted)]"
                      >
                        جارٍ اختيار منتجات من مجموعة VELORA…
                      </p>
                    );
                  }
                  if (part.state === "output-available") {
                    const output = part.output as {
                      products?: RecommendedProduct[];
                      ritualNote?: string | null;
                    };
                    return (
                      <div
                        key={`${message.id}-tool-${index}`}
                        className="max-w-[95%] border border-[var(--plum)]/10 bg-[var(--champagne)]/40 p-3"
                      >
                        <p className="t1 mb-2 font-medium tracking-[0.12em] text-[var(--plum)]">
                          مقترح لكِ من المتجر
                        </p>
                        <ProductRecommendationCards
                          items={output.products ?? []}
                          ritualNote={output.ritualNote}
                          compact
                        />
                      </div>
                    );
                  }
                }

                return null;
              })}
            </div>
          ))}

          {busy ? (
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse bg-[var(--plum)]" />
                <span className="h-1.5 w-1.5 animate-pulse bg-[var(--plum)] [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-pulse bg-[var(--plum)] [animation-delay:240ms]" />
              </span>
              <span className="t2">المستشارة تكتب…</span>
            </div>
          ) : null}

          {error ? (
            <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              تعذّر الاتصال بالمستشارة. حاولي مرة أخرى.
              <button
                type="button"
                className="ms-3 underline"
                onClick={() => clearError()}
              >
                حسناً
              </button>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        <div className="border-t border-[var(--plum)]/10 px-5 py-4 sm:px-8">
          <div className="mb-3 flex flex-wrap gap-2">
            {advisorStarters.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => send(s)}
                className="t2 bg-[var(--mist)] px-3 py-1.5 text-[var(--plum)] transition-colors hover:bg-[var(--champagne)] disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder="صفي بشرتكِ أو هدفكِ الجمالي…"
              className="t3 flex-1 border border-[var(--plum)]/15 bg-transparent px-4 py-3 outline-none focus:border-[var(--plum)]/40 disabled:opacity-60"
            />
            {busy ? (
              <Button type="button" variant="outline" onClick={() => stop()}>
                إيقاف
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()}>
                {ui.send}
              </Button>
            )}
          </form>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display t6 font-medium text-[var(--plum)]">
          {ui.recommended}
        </h2>
        <p className="t3 mt-2 text-[var(--muted)]">
          منتجات اختارتها المستشارة من كتالوج VELORA.
        </p>

        <div className="mt-6">
          {sidebarRecs.length ? (
            <ProductRecommendationCards items={sidebarRecs} />
          ) : (
            <p className="t3 text-[var(--muted)]">
              ابدئي المحادثة لتظهر هنا بطاقات المنتجات المقترحة مع إمكانية الإضافة للحقيبة.
            </p>
          )}
        </div>

        <Link href="/shop" className="mt-10 inline-block">
          <Button variant="outline">تصفّح المتجر كاملاً</Button>
        </Link>

        {!provider?.aiEnabled ? (
          <p className="t2 mt-8 leading-relaxed text-[var(--muted)]">
            لتفعيل نموذج سحابي أقوى (OpenAI أو Gemini)، أضيفي المفتاح في ملف{" "}
            <span dir="ltr">.env.local</span> ثم أعيدي تشغيل السيرفر.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
