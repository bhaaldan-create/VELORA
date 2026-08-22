"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  collectTags,
  visibleQuestions,
  type LarsaPathDef,
} from "@/data/larsa-consultation";
import { LarsaAvatar } from "@/components/advisor/LarsaAvatar";
import { LarsaMark } from "@/components/advisor/LarsaIcons";
import { cn } from "@/lib/utils";

export function LarsaConsult({
  path,
  onComplete,
  onBack,
}: {
  path: LarsaPathDef;
  onComplete: (payload: {
    answers: Record<string, string | string[]>;
    freeText: string;
    tags: string[];
  }) => void;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [freeText, setFreeText] = useState("");
  const [understood, setUnderstood] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const questions = useMemo(
    () => visibleQuestions(path, answers),
    [path, answers],
  );

  const total = Math.max(questions.length, 1);
  const safeIndex = Math.min(stepIndex, questions.length - 1);
  const current = questions[safeIndex];
  const progress = ((safeIndex + 1) / total) * 100;

  const selected = current ? answers[current.id] : undefined;

  const goNext = (nextAnswers: Record<string, string | string[]>) => {
    const nextQs = visibleQuestions(path, nextAnswers);
    const nextIdx = stepIndex + 1;
    if (nextIdx >= nextQs.length) {
      onComplete({
        answers: nextAnswers,
        freeText,
        tags: collectTags(path, nextAnswers, freeText),
      });
      return;
    }
    setStepIndex(nextIdx);
  };

  const pickSingle = (optionId: string) => {
    if (!current) return;
    const next = { ...answers, [current.id]: optionId };
    setAnswers(next);
    window.setTimeout(() => goNext(next), 220);
  };

  const toggleMulti = (optionId: string) => {
    if (!current) return;
    const prev = answers[current.id];
    const arr = Array.isArray(prev) ? [...prev] : [];
    if (optionId === "none") {
      setAnswers({ ...answers, [current.id]: ["none"] });
      return;
    }
    const withoutNone = arr.filter((x) => x !== "none");
    const idx = withoutNone.indexOf(optionId);
    if (idx >= 0) withoutNone.splice(idx, 1);
    else withoutNone.push(optionId);
    setAnswers({ ...answers, [current.id]: withoutNone });
  };

  const submitMulti = () => {
    if (!current) return;
    const val = answers[current.id];
    if (!val || (Array.isArray(val) && val.length === 0)) return;
    goNext(answers);
  };

  const onFreeSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setFreeText((prev) => (prev ? `${prev} · ${text}` : text));
    const tags = collectTags(path, answers, text);
    setUnderstood(tags.slice(0, 5));
    setDraft("");
  };

  if (!current) return null;

  return (
    <div dir="rtl" className="relative min-h-[calc(100vh-5rem)] overflow-x-hidden bg-[var(--larsa-white)]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 28% at 50% 0%, rgba(243,237,245,0.9), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-[var(--larsa-border)] px-3.5 py-1.5 text-[12px] text-[var(--larsa-plum)] transition-colors duration-[220ms] hover:border-[var(--larsa-border-strong)] hover:bg-[var(--larsa-lavender)]"
          >
            رجوع
          </button>
          <div className="flex items-center gap-2">
            <LarsaMark size={20} />
            <span className="font-latin text-[12px] font-semibold tracking-[0.22em] text-[var(--larsa-plum)]">
              LARSA
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center text-center">
          <LarsaAvatar size="md" active />
          <p className="mt-5 text-[0.95rem] text-[var(--larsa-plum-soft)]">{path.intro}</p>
        </div>

        {/* Progress */}
        <div className="mx-auto mt-10 max-w-md">
          <div className="flex items-center justify-between gap-3 text-[12px] text-[var(--larsa-muted)]">
            <span>رحلتكِ مع لارسا</span>
            <span className="font-latin tabular-nums">
              {String(safeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-[var(--larsa-lavender-deep)]">
            <div
              className="h-full rounded-full bg-[var(--larsa-plum)] transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-10 text-center">
          <h1 className="font-display text-[clamp(1.35rem,3.5vw,1.85rem)] font-semibold leading-snug text-[var(--larsa-plum)]">
            {current.title}
          </h1>
          {current.subtitle ? (
            <p className="mx-auto mt-3 max-w-md text-[0.9rem] text-[var(--larsa-plum-soft)]">
              {current.subtitle}
            </p>
          ) : null}
        </div>

        {understood.length ? (
          <div className="mx-auto mt-6 max-w-lg rounded-[20px] border border-[var(--larsa-border)] bg-[var(--larsa-lavender)]/60 px-4 py-3 text-center">
            <p className="text-[12px] font-medium text-[var(--larsa-plum)]">فهمت احتياجكِ</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {understood.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white px-3 py-1 text-[11px] text-[var(--larsa-plum)] ring-1 ring-[var(--larsa-border)]"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[var(--larsa-plum-soft)]">
              خليني أرتب لكِ الخيارات الأنسب…
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {current.options.map((opt) => {
            const isSelected = current.multi
              ? Array.isArray(selected) && selected.includes(opt.id)
              : selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  current.multi ? toggleMulti(opt.id) : pickSingle(opt.id)
                }
                className={cn(
                  "rounded-[22px] border px-5 py-5 text-start transition-all duration-[200ms] ease-out",
                  isSelected
                    ? "border-[var(--larsa-plum)] bg-[var(--larsa-lavender)]"
                    : "border-[var(--larsa-border)] bg-white hover:border-[var(--larsa-border-strong)] hover:bg-[var(--larsa-wash)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[1rem] font-semibold text-[var(--larsa-plum)]">
                      {opt.label}
                    </p>
                    {opt.hint ? (
                      <p className="mt-1 text-[0.8rem] text-[var(--larsa-plum-soft)]">
                        {opt.hint}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-[200ms]",
                      isSelected
                        ? "border-[var(--larsa-plum)] bg-[var(--larsa-plum)] text-white"
                        : "border-[var(--larsa-lavender-deep)]",
                    )}
                  >
                    {isSelected ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path
                          d="M2 5.2 4.1 7.2 8 2.8"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {current.multi ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={submitMulti}
              disabled={
                !selected || (Array.isArray(selected) && selected.length === 0)
              }
              className="rounded-full bg-[var(--larsa-plum)] px-8 py-3 text-[0.9rem] font-medium text-white transition-opacity duration-[200ms] disabled:opacity-40"
            >
              متابعة
            </button>
          </div>
        ) : null}

        <form onSubmit={onFreeSubmit} className="mt-10">
          <label className="sr-only">اكتبي للارسا</label>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="اكتبي للارسا ما تبحثين عنه…"
              className="flex-1 rounded-[16px] border border-[var(--larsa-border)] bg-[var(--larsa-wash)] px-4 py-3.5 text-[0.925rem] text-[var(--larsa-plum)] outline-none transition-[border-color] duration-[200ms] placeholder:text-[var(--larsa-muted)] focus:border-[var(--larsa-border-strong)]"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="shrink-0 rounded-[16px] bg-[var(--larsa-plum)] px-5 text-[0.875rem] font-medium text-white disabled:opacity-40"
            >
              إرسال
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
