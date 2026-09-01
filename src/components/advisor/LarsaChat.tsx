"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { LarsaAvatar } from "@/components/advisor/LarsaAvatar";
import { LarsaMark } from "@/components/advisor/LarsaIcons";
import { ProductRecommendationCards } from "@/components/advisor/ProductRecommendationCards";
import type { RecommendedProduct } from "@/components/advisor/ProductRecommendationCards";
import { advisorStarters } from "@/data/advisor-starters";
import { LARSA_EXPLORE_TOPICS } from "@/data/larsa-knowledge";
import { cn } from "@/lib/utils";

type ToolRecOutput = {
  products?: RecommendedProduct[];
  ritualNote?: string | null;
  ritualSteps?: string[] | null;
};

function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("\n")
    .trim();
}

function toolOutputs(message: UIMessage): ToolRecOutput[] {
  const out: ToolRecOutput[] = [];
  for (const part of message.parts ?? []) {
    if (part.type !== "tool-recommendProducts") continue;
    if (part.state !== "output-available") continue;
    const output = part.output as ToolRecOutput | undefined;
    if (output?.products?.length) out.push(output);
  }
  return out;
}

export function LarsaChat({
  onBack,
  initialPrompt,
}: {
  onBack: () => void;
  initialPrompt?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const sentInitial = useRef(false);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/advisor" }),
  });

  useEffect(() => {
    const q = initialPrompt?.trim();
    if (!q || sentInitial.current) return;
    sentInitial.current = true;
    void sendMessage({ text: q });
  }, [initialPrompt, sendMessage]);

  const busy = status === "streaming" || status === "submitted";

  const starters = useMemo(
    () => [
      ...advisorStarters.slice(0, 4),
      ...LARSA_EXPLORE_TOPICS.slice(0, 4).map((t) => t.prompt),
    ],
    [],
  );

  const submit = (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    void sendMessage({ text: q });
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  return (
    <div
      dir="rtl"
      className="relative flex min-h-[calc(100vh-5rem)] flex-col overflow-hidden bg-[var(--larsa-wash)]"
    >
      <div className="larsa-lobby-ambient pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative z-[1] border-b border-[var(--larsa-border)] bg-[var(--larsa-white)]/90 px-5 py-4 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LarsaAvatar size="sm" active={busy} />
            <div>
              <div className="flex items-center gap-2">
                <LarsaMark size={18} />
                <span className="font-latin text-[11px] font-semibold tracking-[0.22em] text-[var(--larsa-plum)]">
                  LARSA
                </span>
              </div>
              <p className="mt-0.5 text-[0.85rem] text-[var(--larsa-plum-soft)]">
                محادثة حرة — اسألي عن بشرتكِ، شعركِ، أو مكياجكِ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-full border border-[var(--larsa-border)] px-4 py-2 text-[0.8rem] font-medium text-[var(--larsa-plum)] hover:bg-[var(--larsa-lavender)]"
          >
            رجوع
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="relative z-[1] flex-1 overflow-y-auto px-5 py-6 sm:px-8"
      >
        <div className="mx-auto max-w-3xl space-y-5">
          {messages.length === 0 ? (
            <div className="rounded-[22px] border border-[var(--larsa-border)] bg-white p-6 text-center">
              <p className="text-[0.95rem] leading-relaxed text-[var(--larsa-plum-soft)]">
                مرحباً — أنا لارسا. احكي لي عن بشرتكِ أو شعركِ أو مناسبتكِ،
                وأرتّب لكِ روتيناً من منتجات VELORA فقط.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-full bg-[var(--larsa-lavender)] px-3.5 py-2 text-[12px] text-[var(--larsa-plum)] ring-1 ring-[var(--larsa-border)] transition hover:bg-[var(--larsa-lavender-deep)]/30"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => {
            const text = messageText(message);
            const recs = message.role === "assistant" ? toolOutputs(message) : [];
            const isUser = message.role === "user";

            if (!text && !recs.length) return null;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isUser ? "justify-start" : "justify-end",
                )}
              >
                <div
                  className={cn(
                    "max-w-[92%] rounded-[20px] px-4 py-3 text-[0.925rem] leading-relaxed sm:max-w-[85%]",
                    isUser
                      ? "bg-[var(--larsa-plum)] text-white"
                      : "border border-[var(--larsa-border)] bg-white text-[var(--larsa-plum)]",
                  )}
                >
                  {text ? (
                    <p className="whitespace-pre-wrap">{text}</p>
                  ) : null}
                  {recs.map((block, i) => (
                    <ProductRecommendationCards
                      key={`${message.id}-rec-${i}`}
                      items={block.products ?? []}
                      ritualNote={block.ritualNote}
                      ritualSteps={block.ritualSteps}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {busy ? (
            <div className="flex justify-end">
              <div className="rounded-[20px] border border-[var(--larsa-border)] bg-white px-4 py-3 text-[0.875rem] text-[var(--larsa-muted)]">
                لارسا تفكّر…
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-center text-[0.875rem] text-red-700">
              تعذّر الرد — حاولي مرة أخرى.
            </p>
          ) : null}
        </div>
      </div>

      <footer className="relative z-[1] border-t border-[var(--larsa-border)] bg-[var(--larsa-white)] px-5 py-4 sm:px-8">
        <form
          className="mx-auto flex max-w-3xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتبي سؤالكِ…"
            disabled={busy}
            className="flex-1 rounded-full border border-[var(--larsa-border)] bg-[var(--larsa-wash)] px-5 py-3 text-[0.925rem] text-[var(--larsa-plum)] outline-none focus:border-[var(--larsa-border-strong)] disabled:opacity-60"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="shrink-0 rounded-full border border-[var(--larsa-border)] px-5 py-3 text-[0.875rem] font-medium text-[var(--larsa-plum)]"
            >
              إيقاف
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 rounded-full bg-[var(--larsa-plum)] px-6 py-3 text-[0.875rem] font-medium text-white disabled:opacity-40"
            >
              أرسلي
            </button>
          )}
        </form>
      </footer>
    </div>
  );
}
