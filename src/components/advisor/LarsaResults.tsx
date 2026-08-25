"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { LarsaAvatar } from "@/components/advisor/LarsaAvatar";
import { LarsaMark } from "@/components/advisor/LarsaIcons";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductPrice } from "@/components/shop/ProductPrice";
import type { RecommendedProduct } from "@/components/advisor/ProductRecommendationCards";
import type { CategorySlug, Product } from "@/types";
import { cn } from "@/lib/utils";

function toProduct(item: RecommendedProduct): Product {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    nameAr: item.nameAr,
    category: item.category as CategorySlug,
    price: item.price,
    originalPrice: item.originalPrice,
    discountPercent: item.discountPercent,
    currency: item.currency ?? "IQD",
    description: item.description ?? "",
    descriptionAr: item.descriptionAr ?? "",
    benefits: item.benefits ?? [],
    benefitsAr: item.benefitsAr ?? [],
    ingredients: item.ingredients ?? [],
    concerns: item.concerns ?? [],
    size: item.size,
    isBestseller: item.isBestseller,
    isNew: item.isNew,
    rating: item.rating ?? 0,
    reviews: item.reviews ?? 0,
    imageTone: item.imageTone,
    imageUrl: item.imageUrl,
  };
}

export function LarsaResults({
  products,
  ritualSteps,
  ritualNote,
  understood,
  pathTitle,
  onRestart,
}: {
  products: RecommendedProduct[];
  ritualSteps: string[];
  ritualNote?: string;
  understood: string[];
  pathTitle: string;
  onRestart: () => void;
}) {
  const { addItem } = useCart();

  const addAll = () => {
    for (const item of products) addItem(toProduct(item));
  };

  return (
    <div dir="rtl" className="relative min-h-[calc(100vh-5rem)] overflow-x-hidden bg-[var(--larsa-white)]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 50% 0%, rgba(243,237,245,0.9), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col items-center text-center">
          <LarsaAvatar size="md" active />
          <div className="mt-4 flex items-center gap-2">
            <LarsaMark size={22} />
            <span className="font-latin text-[13px] font-semibold tracking-[0.24em] text-[var(--larsa-plum)]">
              LARSA
            </span>
          </div>
          <h1 className="font-display mt-5 text-[clamp(1.5rem,3.5vw,2.1rem)] font-semibold text-[var(--larsa-plum)]">
            لقيت لكِ مجموعة منتجات أشوفها مناسبة لاحتياجاتكِ
          </h1>
          <p className="mt-3 max-w-lg text-[0.95rem] text-[var(--larsa-plum-soft)]">
            بناءً على إجاباتكِ في «{pathTitle}» — رتّبت لكِ روتيناً واضحاً من منتجات VELORA فقط.
          </p>
        </div>

        {understood.length ? (
          <div className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-2">
            {understood.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--larsa-lavender)] px-3 py-1.5 text-[12px] text-[var(--larsa-plum)] ring-1 ring-[var(--larsa-border)]"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        {/* Routine */}
        <section className="mt-12 rounded-[22px] border border-[var(--larsa-border)] bg-[var(--larsa-wash)] p-6 sm:p-8">
          <p className="text-[12px] font-medium tracking-wide text-[var(--larsa-muted)]">
            روتينكِ الخاص
          </p>
          <h2 className="mt-2 text-[1.2rem] font-semibold text-[var(--larsa-plum)]">
            خليني أرتب لكِ الخطوات
          </h2>
          {ritualNote ? (
            <p className="mt-2 text-[0.875rem] text-[var(--larsa-plum-soft)]">{ritualNote}</p>
          ) : null}
          <ol className="mt-5 space-y-3">
            {ritualSteps.map((step, i) => (
              <li key={step} className="flex gap-3 text-[0.95rem] text-[var(--larsa-plum)]">
                <span className="font-latin flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--larsa-lavender)] text-[11px] font-semibold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Products */}
        <section className="mt-12">
          <h2 className="text-[1.2rem] font-semibold text-[var(--larsa-plum)]">
            المنتجات التي اخترتها لكِ
          </h2>
          <div className="mt-6 space-y-4">
            {products.map((item, i) => (
              <article
                key={item.id}
                className={cn(
                  "flex flex-col gap-4 rounded-[22px] border border-[var(--larsa-border)] bg-white p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5",
                  "motion-safe:animate-[velora-rise_0.6s_ease-out_both]",
                )}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <Link
                  href={`/shop/${item.slug}`}
                  className="relative mx-auto aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-[18px] bg-[var(--larsa-lavender)] sm:mx-0 sm:w-32"
                >
                  <ProductMedia
                    name={item.nameAr}
                    imageTone={item.imageTone}
                    imageUrl={item.imageUrl}
                    aspectClassName="aspect-[3/4]"
                    sizes="128px"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <p className="font-latin text-[11px] tracking-[0.12em] text-[var(--larsa-muted)] uppercase">
                    {item.name}
                  </p>
                  <Link href={`/shop/${item.slug}`}>
                    <h3 className="mt-1 text-[1.05rem] font-semibold text-[var(--larsa-plum)]">
                      {item.nameAr}
                    </h3>
                  </Link>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--larsa-plum-soft)]">
                    وهذا المنتج تحديداً اخترته لكِ لأن{" "}
                    {item.benefitsAr[0] ?? "يناسب احتياجكِ الحالي"}
                    {item.benefitsAr[1] ? `، و${item.benefitsAr[1]}` : ""}.
                  </p>
                  <div className="mt-auto space-y-3 pt-4">
                    <ProductPrice
                      price={item.price}
                      originalPrice={item.originalPrice}
                      discountPercent={item.discountPercent}
                      size="sm"
                    />
                    <AddToBagButton
                      size="md"
                      flashAdded
                      onClick={() => addItem(toProduct(item))}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={addAll}
            disabled={!products.length}
            className="w-full rounded-full bg-[var(--larsa-plum)] px-8 py-3.5 text-[0.95rem] font-medium text-white transition-opacity disabled:opacity-40 sm:w-auto"
          >
            أضيفي الروتين إلى السلة
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full rounded-full border border-[var(--larsa-border)] px-8 py-3.5 text-[0.95rem] font-medium text-[var(--larsa-plum)] hover:bg-[var(--larsa-lavender)] sm:w-auto"
          >
            ابدئي استشارة جديدة
          </button>
        </div>
      </div>
    </div>
  );
}
