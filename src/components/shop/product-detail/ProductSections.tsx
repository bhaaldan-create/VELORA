"use client";

import { useId, useState } from "react";
import type { Product } from "@/types";
import { CONCERN_LABELS, productCopy } from "./copy";
import { cn } from "@/lib/utils";

export function ProductBenefits({
  product,
  ar,
}: {
  product: Product;
  ar: boolean;
}) {
  const items = (ar ? product.benefitsAr : product.benefits)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (!items.length) return null;

  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-3">
      {items.map((text) => {
        const [title, ...rest] = text.split(/[:：–—-]/);
        const body = rest.join("—").trim();
        return (
          <li
            key={text}
            className="rounded-[18px] border border-[var(--plum)]/8 bg-white/70 px-4 py-4 shadow-[0_6px_20px_rgba(50,22,47,0.04)]"
          >
            <p className="text-[0.82rem] font-semibold leading-snug text-[var(--plum)]">
              {(title || text).trim()}
            </p>
            {body ? (
              <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[var(--muted)]">
                {body}
              </p>
            ) : null}
          </li>
        );
      })}
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
  const long = text.length > 220;
  const preview = long && !open ? `${text.slice(0, 210).trim()}…` : text;

  return (
    <section className="mt-10 border-t border-[var(--plum)]/8 pt-8">
      <h2 className="text-[0.72rem] font-medium tracking-[0.16em] text-[var(--muted)]">
        {copy.about}
      </h2>
      <p
        id={id}
        className="mt-3 text-[0.95rem] leading-[1.75] text-[var(--ink)]/80"
      >
        {preview}
      </p>
      {long ? (
        <button
          type="button"
          className="mt-3 text-[0.8rem] font-medium text-[var(--plum)] underline-offset-4 hover:underline"
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
    <section className="mt-10 border-t border-[var(--plum)]/8 pt-8">
      <h2 className="text-[0.72rem] font-medium tracking-[0.16em] text-[var(--muted)]">
        {copy.ingredients}
      </h2>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {items.slice(0, 8).map((item) => (
          <li
            key={item}
            className="rounded-[16px] bg-[var(--mist)]/80 px-4 py-3"
            dir="ltr"
          >
            <p className="text-[0.85rem] font-medium text-[var(--plum)]">
              {item}
            </p>
          </li>
        ))}
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
    <section className="mt-10 border-t border-[var(--plum)]/8 pt-8">
      <h2 className="text-[0.72rem] font-medium tracking-[0.16em] text-[var(--muted)]">
        {copy.suitability}
      </h2>
      <p className="mt-3 text-[0.8rem] text-[var(--muted)]">{copy.suitableFor}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        <li className="rounded-full border border-[var(--plum)]/12 bg-white px-3.5 py-1.5 text-[0.75rem] text-[var(--plum)]">
          {copy.dailyUse}
        </li>
        {concerns.map((c) => {
          const label = CONCERN_LABELS[c];
          if (!label) return null;
          return (
            <li
              key={c}
              className="rounded-full border border-[var(--plum)]/12 bg-white px-3.5 py-1.5 text-[0.75rem] text-[var(--plum)]"
            >
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
        "mt-10 overflow-hidden rounded-[24px] border border-[var(--plum)]/10",
        "bg-[linear-gradient(135deg,#32162f_0%,#4a2a45_45%,#6b4a68_100%)]",
        "px-5 py-6 sm:px-6 sm:py-7",
      )}
    >
      <p className="text-[0.68rem] font-medium tracking-[0.18em] text-white/55">
        LARSA
      </p>
      <h2 className="mt-2 max-w-md font-display text-[1.15rem] font-semibold leading-snug text-white sm:text-[1.25rem]">
        {copy.larsaTitle}
      </h2>
      <p className="mt-2 max-w-sm text-[0.8rem] leading-relaxed text-white/75">
        {copy.larsaSub}
      </p>
      <a
        href="/advisor"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-[0.82rem] font-medium text-[var(--plum)] transition hover:scale-[1.02] active:scale-[0.98]"
      >
        {copy.askLarsa}
      </a>
    </section>
  );
}
