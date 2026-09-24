"use client";

import { useId, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  ClipboardList,
  Droplets,
  Layers,
  LayoutGrid,
  Ruler,
  Shield,
  Sparkles,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { LarsaAvatar } from "@/components/advisor/LarsaAvatar";
import { categoryLabels } from "@/constants/brand";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import {
  CONCERN_LABELS,
  isPresentValue,
  productCopy,
  SKIN_TYPE_COPY,
} from "./copy";
import {
  benefitFallbackHint,
  benefitIconFor,
  benefitParts,
  concernIcon,
  ingredientIconFor,
  skinTypeIcon,
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
    .filter(isPresentValue);
  const [expanded, setExpanded] = useState(false);
  if (!all.length) return null;

  const visible = expanded ? all.slice(0, 6) : all.slice(0, 4);
  const hasMore = all.length > 4;

  return (
    <div className="mt-6">
      <p className="text-[0.68rem] font-medium tracking-[0.14em] text-[var(--muted)]">
        {copy.keyBenefits}
      </p>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {visible.map((text, i) => {
          const Icon = benefitIconFor(text, i);
          const { title, detail } = benefitParts(text);
          const hint = detail || benefitFallbackHint(text, ar);
          return (
            <li
              key={`${title}-${i}`}
              className="pdp-benefit motion-safe:animate-[velora-rise_0.55s_ease-out_both]"
              style={{ animationDelay: `${0.06 + i * 0.05}s` }}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  "bg-white/70 text-[var(--plum)]",
                  "ring-1 ring-[var(--plum)]/[0.08]",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.4} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.84rem] font-semibold leading-snug text-[var(--plum)]">
                  {title}
                </span>
                <span className="mt-0.5 block text-[0.72rem] leading-relaxed text-[var(--muted)]">
                  {hint}
                </span>
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
  if (isPresentValue(product.size)) {
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
  if (!isPresentValue(text)) return null;

  const [open, setOpen] = useState(false);
  const id = useId();
  const long = text.length > 220;
  const firstBreak = text.search(/[.。!?؟]/);
  const lead =
    firstBreak > 24 && firstBreak < 160
      ? text.slice(0, firstBreak + 1).trim()
      : text.slice(0, Math.min(120, text.length)).trim();
  const rest = text.slice(lead.length).trim();
  const showRest = open || !long ? rest : rest ? `${rest.slice(0, 100).trim()}…` : "";

  return (
    <section className="pdp-section">
      <header className="pdp-about__header">
        <span className="pdp-about__icon" aria-hidden>
          <BookOpen className="h-[18px] w-[18px]" strokeWidth={1.4} />
        </span>
        <div className="min-w-0">
          <h2 className="pdp-about__title">{ar ? copy.aboutAr : copy.about}</h2>
          <p className="pdp-about__eyebrow" dir="ltr">
            {ar ? copy.aboutEn : copy.aboutAr}
          </p>
        </div>
      </header>

      <div
        id={id}
        className="mt-4 max-w-prose text-[0.92rem] leading-[1.85] text-[var(--ink)]/78"
      >
        <p>
          <span className="font-medium text-[var(--plum)]/92">{lead}</span>
          {showRest ? (
            <>
              {" "}
              <span>{showRest}</span>
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
  const items = (product.ingredients || [])
    .map((i) => i.trim())
    .filter(isPresentValue);

  if (!items.length) return null;

  return (
    <section className="pdp-section">
      <h2 className="pdp-section__title">{copy.ingredients}</h2>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, 9).map((item, i) => {
          const Icon = ingredientIconFor(item, i);
          const { title, detail } = benefitParts(item);
          return (
            <li
              key={`${item}-${i}`}
              className={cn(
                "flex flex-col items-start gap-2.5 rounded-[1.1rem] p-3.5",
                "bg-[var(--larsa-lavender)]/40",
                "ring-1 ring-[var(--plum)]/[0.06]",
                "transition hover:ring-[var(--plum)]/12",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-white/80 text-[var(--plum)]",
                  "ring-1 ring-[var(--plum)]/[0.07]",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.35} aria-hidden />
              </span>
              <span className="min-w-0" dir="ltr">
                <span className="block text-[0.8rem] font-semibold leading-snug text-[var(--plum)]">
                  {title}
                </span>
                {detail ? (
                  <span className="mt-0.5 block text-[0.7rem] leading-relaxed text-[var(--muted)]">
                    {detail}
                  </span>
                ) : null}
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
  const skinTypes = (product.skinTypes || []).filter(Boolean);
  const concerns = product.concerns || [];

  if (!skinTypes.length && !concerns.length) return null;

  return (
    <section className="pdp-section">
      <h2 className="pdp-section__title">{copy.suitability}</h2>
      <p className="pdp-section__sub">{copy.suitabilitySub}</p>

      {skinTypes.length > 0 ? (
        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {skinTypes.map((type) => {
            const meta = SKIN_TYPE_COPY[type];
            if (!meta) return null;
            const Icon = skinTypeIcon(type);
            return (
              <li key={type} className="pdp-skin-chip">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full",
                      "bg-[var(--plum)]/[0.06] text-[var(--plum)]",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="text-[0.88rem] font-semibold text-[var(--plum)]">
                    {ar ? meta.ar : meta.en}
                  </span>
                  <Check
                    className="ms-auto h-3.5 w-3.5 text-[var(--blush)]"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                </span>
                <span className="ps-9 text-[0.72rem] leading-relaxed text-[var(--muted)]">
                  {ar ? meta.hintAr : meta.hintEn}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {concerns.length > 0 ? (
        <div className={cn(skinTypes.length ? "mt-5" : "mt-4")}>
          <p className="text-[0.68rem] font-medium tracking-[0.12em] text-[var(--muted)]">
            {copy.concernsLabel}
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
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
        </div>
      ) : null}
    </section>
  );
}

function extractSpf(product: Product): string | null {
  const pool = [
    product.size,
    product.productType,
    ...(product.featureTags || []),
    ...(product.benefits || []),
    ...(product.benefitsAr || []),
    product.name,
    product.nameAr,
  ]
    .filter(Boolean)
    .join(" ");
  const m = pool.match(/spf\s*[:\-]?\s*(\d{1,2})/i);
  return m ? m[1] : null;
}

function extractTagged(
  tags: string[] | undefined,
  pattern: RegExp,
): string | null {
  for (const t of tags || []) {
    if (!isPresentValue(t)) continue;
    if (pattern.test(t)) return t.trim();
  }
  return null;
}

export function ProductDetails({
  product,
  ar,
}: {
  product: Product;
  ar: boolean;
}) {
  const copy = productCopy(ar);
  const category = categoryLabels[product.category];
  const spf = extractSpf(product);
  const coverage = extractTagged(
    product.featureTags,
    /تغطية|coverage|medium|full|light|build/i,
  );
  const finish = extractTagged(
    product.featureTags,
    /لمسة|finish|matte|dew|glow|طبيع|natural/i,
  );

  const rows: {
    key: string;
    label: string;
    value: string;
    Icon: LucideIcon;
    ltr?: boolean;
  }[] = [];

  if (isPresentValue(product.size)) {
    rows.push({
      key: "size",
      label: copy.detailSize,
      value: product.size.trim(),
      Icon: Ruler,
      ltr: true,
    });
  }
  if (isPresentValue(product.productType || undefined)) {
    rows.push({
      key: "type",
      label: copy.detailType,
      value: product.productType!.trim(),
      Icon: Tag,
      ltr: true,
    });
  }
  if (category) {
    rows.push({
      key: "cat",
      label: copy.detailCategory,
      value: category,
      Icon: LayoutGrid,
    });
  }
  if (isPresentValue(product.brandName || undefined)) {
    rows.push({
      key: "brand",
      label: copy.detailBrand,
      value: product.brandName!.trim(),
      Icon: BadgeCheck,
      ltr: true,
    });
  }
  if (coverage) {
    rows.push({
      key: "cov",
      label: copy.detailCoverage,
      value: coverage,
      Icon: Layers,
    });
  }
  if (finish) {
    rows.push({
      key: "fin",
      label: copy.detailFinish,
      value: finish,
      Icon: Droplets,
    });
  }
  if (spf) {
    rows.push({
      key: "spf",
      label: copy.detailSpf,
      value: spf,
      Icon: Shield,
      ltr: true,
    });
  }

  if (!rows.length) return null;

  return (
    <section className="pdp-section">
      <header className="pdp-details__header">
        <span className="pdp-details__icon" aria-hidden>
          <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.4} />
        </span>
        <h2 className="pdp-details__title">{copy.details}</h2>
      </header>

      <dl className="pdp-details__glass mt-4">
        {rows.map((row) => {
          const Icon = row.Icon;
          return (
            <div key={row.key} className="pdp-spec-row">
              <dt className="pdp-spec-row__label">
                <span className="pdp-spec-row__icon" aria-hidden>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.45} />
                </span>
                <span>{row.label}</span>
              </dt>
              <dd
                className="pdp-spec-row__value"
                dir={row.ltr ? "ltr" : undefined}
              >
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function ProductLarsaCard({ ar }: { ar: boolean }) {
  const copy = productCopy(ar);
  return (
    <section
      className={cn(
        "mt-10 overflow-hidden rounded-[1.6rem]",
        "bg-[linear-gradient(145deg,var(--larsa-lavender)_0%,#fbfafc_48%,var(--larsa-lavender-deep)_100%)]",
        "px-5 py-5 sm:px-6 sm:py-6",
        "ring-1 ring-[var(--larsa-border)]",
        "backdrop-blur-sm",
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
        className={cn(
          "group mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2",
          "rounded-full bg-[var(--larsa-plum)] px-5 text-[0.84rem] font-medium text-white",
          "transition hover:opacity-95 active:scale-[0.98] sm:w-auto",
        )}
      >
        {copy.askLarsa}
        <ArrowUpRight
          className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={1.5}
          aria-hidden
        />
      </a>
    </section>
  );
}

export function ProductRatingRow({
  product,
  ar,
}: {
  product: Product;
  ar: boolean;
}) {
  const copy = productCopy(ar);
  if (!(product.reviews > 0)) {
    return (
      <p className="mt-3 text-[0.78rem] text-[var(--muted)]">{copy.noReviews}</p>
    );
  }

  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.78rem] text-[var(--muted)]">
      <span className="inline-flex items-center gap-1 text-[var(--plum)]">
        <Star
          className="h-3.5 w-3.5 fill-[var(--blush)] text-[var(--blush)]"
          strokeWidth={1.2}
          aria-hidden
        />
        <span className="font-medium tabular-nums">
          {product.rating.toFixed(1)}
        </span>
      </span>
      <span className="text-[var(--plum)]/25" aria-hidden>
        ·
      </span>
      <span>
        {product.reviews.toLocaleString(ar ? "ar-IQ" : "en-US")} {copy.reviews}
      </span>
      <span className="text-[var(--plum)]/25" aria-hidden>
        ·
      </span>
      <a
        href="#reviews"
        className="text-[var(--plum)]/70 underline-offset-4 transition hover:text-[var(--plum)] hover:underline"
      >
        {copy.viewReviews}
      </a>
    </div>
  );
}

/** Decorative sparkle kept for legacy section headers if needed */
export function SectionSparkle() {
  return (
    <Sparkles
      className="h-3.5 w-3.5 text-[var(--blush)]"
      strokeWidth={1.4}
      aria-hidden
    />
  );
}
