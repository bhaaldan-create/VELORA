"use client";

import { useId, useState } from "react";
import { Sparkles } from "lucide-react";
import { LarsaAvatar } from "@/components/advisor/LarsaAvatar";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { CONCERN_LABELS, productCopy } from "./copy";
import {
  benefitIconFor,
  benefitLabel,
  concernIcon,
  ingredientIconFor,
} from "./visualIcons";

export function ProductBenefits({
  product,
  ar,
}: {
  product: Product;
  ar: boolean;
}) {
  const copy = productCopy(ar);
  const all = (ar ? product.benefitsAr : product.benefits)
    .map((t) => t.trim())
    .filter(Boolean);
  const [expanded, setExpanded] = useState(false);
  if (!all.length) return null;

  const visible = expanded ? all.slice(0, 6) : all.slice(0, 4);
  const hasMore = all.length > 4;

  return (
    <div className="mt-5">
      <ul className="flex flex-wrap items-start justify-center gap-x-5 gap-y-3 sm:justify-start sm:gap-x-7">
        {visible.map((text, i) => {
          const Icon = benefitIconFor(text, i);
          const label = benefitLabel(text);
          return (
            <li
              key={`${label}-${i}`}
              className={cn(
                "flex w-[4.75rem] flex-col items-center gap-1.5 text-center sm:w-[5.25rem]",
                "motion-safe:animate-[velora-rise_0.55s_ease-out_both]",
              )}
              style={{ animationDelay: `${0.08 + i * 0.06}s` }}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  "bg-[var(--plum)]/[0.06] text-[var(--plum)]",
                  "ring-1 ring-[var(--plum)]/[0.08]",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="text-[0.68rem] font-medium leading-snug text-[var(--plum)]/85">
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-[0.72rem] font-medium tracking-[0.04em] text-[var(--muted)] underline-offset-4 transition hover:text-[var(--plum)] hover:underline"
        >
          {expanded ? copy.lessBenefits : copy.moreBenefits}
        </button>
      ) : null}
    </div>
  );
}

export function ProductMicroTags({
  product,
  ar,
}: {
  product: Product;
  ar: boolean;
}) {
  const tags: { key: string; label: string }[] = [];
  if (product.size?.trim()) {
    tags.push({ key: "size", label: product.size.trim() });
  }
  for (const c of product.concerns || []) {
    const label = CONCERN_LABELS[c];
    if (!label) continue;
    tags.push({ key: c, label: ar ? label.ar : label.en });
  }
  if (!tags.length) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
      {tags.slice(0, 4).map((t) => (
        <li
          key={t.key}
          className="inline-flex items-center gap-1.5 text-[0.7rem] tracking-[0.02em] text-[var(--muted)]"
        >
          <span
            className="h-1 w-1 rounded-full bg-[var(--blush)]"
            aria-hidden
          />
          {t.label}
        </li>
      ))}
    </ul>
  );
}

export function ProductAbout({
  product,
  ar,
}: {
  product: Product;
  ar: boolean;
}) {
  const copy = productCopy(ar);
  const text = (ar ? product.descriptionAr : product.description).trim();
  if (!text) return null;

  const [open, setOpen] = useState(false);
  const id = useId();
  const long = text.length > 200;
  const firstBreak = text.search(/[.。!?؟]/);
  const lead =
    firstBreak > 20 && firstBreak < 140
      ? text.slice(0, firstBreak + 1).trim()
      : text.slice(0, Math.min(110, text.length)).trim();
  const rest = text.slice(lead.length).trim();
  const previewRest =
    long && !open && rest.length > 90
      ? `${rest.slice(0, 90).trim()}…`
      : long && !open
        ? rest
        : rest;

  return (
    <section className="relative mt-11 pt-9">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--plum)]/15 to-transparent"
        aria-hidden
      />

      <div className="flex items-center gap-2.5">
        <h2 className="font-display text-[1.05rem] font-semibold tracking-[0.01em] text-[var(--plum)] sm:text-[1.15rem]">
          {copy.about}
        </h2>
        <Sparkles
          className="h-3.5 w-3.5 text-[var(--blush)]"
          strokeWidth={1.4}
          aria-hidden
        />
      </div>

      <div
        id={id}
        className="mt-4 max-w-prose text-[0.92rem] leading-[1.8] text-[var(--ink)]/75"
      >
        <p>
          <span className="font-medium text-[var(--plum)]/90">{lead}</span>
          {previewRest ? (
            <>
              {" "}
              <span>{previewRest}</span>
            </>
          ) : null}
        </p>
      </div>

      {long ? (
        <button
          type="button"
          className="mt-3.5 text-[0.78rem] font-medium tracking-[0.03em] text-[var(--plum)] underline-offset-4 transition hover:underline"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? copy.readLess : copy.readMore}
        </button>
      ) : null}
    </section>
  );
}

export function ProductIngredients({
  product,
  ar,
}: {
  product: Product;
  ar: boolean;
}) {
  const copy = productCopy(ar);
  const items = product.ingredients.map((i) => i.trim()).filter(Boolean);
  if (!items.length) return null;

  return (
    <section className="relative mt-11 pt-9">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--plum)]/15 to-transparent"
        aria-hidden
      />

      <h2 className="font-display text-[1.05rem] font-semibold text-[var(--plum)] sm:text-[1.15rem]">
        {copy.ingredients}
      </h2>

      <ul className="-mx-1 mt-5 flex gap-3.5 overflow-x-auto px-1 pb-2 admin-scroll sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {items.slice(0, 8).map((item, i) => {
          const Icon = ingredientIconFor(item, i);
          return (
            <li
              key={item}
              className="flex w-[5.5rem] shrink-0 flex-col items-center gap-2.5 text-center sm:w-[6rem]"
              dir="ltr"
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full",
                  "bg-[linear-gradient(160deg,#faf6f3_0%,#f0e8e4_100%)]",
                  "text-[var(--plum)] shadow-[0_8px_24px_-12px_rgba(50,22,47,0.18)]",
                  "ring-1 ring-[var(--plum)]/[0.07]",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.35} aria-hidden />
              </span>
              <span className="text-[0.72rem] font-medium leading-snug text-[var(--plum)]">
                {item}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ProductSuitability({
  product,
  ar,
}: {
  product: Product;
  ar: boolean;
}) {
  const copy = productCopy(ar);
  const concerns = product.concerns || [];
  if (!concerns.length) return null;

  return (
    <section className="relative mt-11 pt-9">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--plum)]/15 to-transparent"
        aria-hidden
      />

      <h2 className="font-display text-[1.05rem] font-semibold text-[var(--plum)] sm:text-[1.15rem]">
        {copy.suitability}
      </h2>
      <p className="mt-1.5 text-[0.75rem] text-[var(--muted)]">
        {copy.suitableFor}
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {concerns.map((c) => {
          const label = CONCERN_LABELS[c];
          if (!label) return null;
          const Icon = concernIcon(c);
          return (
            <li
              key={c}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                "bg-white/70 text-[0.72rem] font-medium text-[var(--plum)]/90",
                "ring-1 ring-[var(--plum)]/[0.08]",
              )}
            >
              <Icon className="h-3 w-3 opacity-70" strokeWidth={1.5} aria-hidden />
              {ar ? label.ar : label.en}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ProductLarsaCard({ ar }: { ar: boolean }) {
  const copy = productCopy(ar);
  return (
    <section
      className={cn(
        "mt-11 overflow-hidden rounded-[1.75rem]",
        "bg-[linear-gradient(145deg,var(--larsa-lavender)_0%,#f7f2f8_48%,var(--larsa-lavender-deep)_100%)]",
        "px-5 py-5 sm:px-6 sm:py-6",
        "ring-1 ring-[var(--larsa-border)]",
      )}
    >
      <div className="flex items-center gap-4">
        <LarsaAvatar size="sm" active className="shrink-0 scale-[0.92]" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-medium tracking-[0.18em] text-[var(--larsa-plum-soft)]">
            {copy.larsaEyebrow}
          </p>
          <h2 className="mt-1 font-display text-[1.05rem] font-semibold leading-snug text-[var(--larsa-plum)] sm:text-[1.15rem]">
            {copy.larsaTitle}
          </h2>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-[var(--larsa-plum-soft)]">
            {copy.larsaSub}
          </p>
        </div>
      </div>
      <a
        href="/advisor"
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[var(--larsa-plum)] px-5 text-[0.8rem] font-medium text-white transition hover:opacity-95 active:scale-[0.98] sm:w-auto"
      >
        {copy.askLarsa}
      </a>
    </section>
  );
}
