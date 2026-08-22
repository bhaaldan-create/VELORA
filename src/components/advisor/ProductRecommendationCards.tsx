"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { categoryLabels } from "@/constants/brand";
import type { CategorySlug, Product, SkinConcern } from "@/types";

export type RecommendedProduct = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency?: "IQD";
  size: string;
  category: string;
  benefits?: string[];
  benefitsAr: string[];
  ingredients?: string[];
  concerns?: SkinConcern[];
  description?: string;
  descriptionAr?: string;
  imageTone: string;
  imageUrl?: string | null;
  rating?: number;
  reviews?: number;
  isBestseller?: boolean;
  isNew?: boolean;
};

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

export function ProductRecommendationCards({
  items,
  ritualNote,
  ritualSteps,
  compact = false,
}: {
  items: RecommendedProduct[];
  ritualNote?: string | null;
  ritualSteps?: string[] | null;
  compact?: boolean;
}) {
  const { addItem } = useCart();

  if (!items.length) return null;

  return (
    <div className={compact ? "mt-3 space-y-3" : "space-y-4"}>
      {ritualSteps?.length ? (
        <ol className="space-y-1.5 border border-[var(--plum)]/10 bg-[var(--ivory)]/70 px-3 py-3">
          {ritualSteps.map((step, i) => (
            <li key={i} className="t2 flex gap-2 text-[var(--ink)]/75">
              <span className="font-medium text-[var(--plum)]">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : ritualNote ? (
        <p className="t2 text-[var(--muted)]">{ritualNote}</p>
      ) : null}
      {items.map((item) => (
        <div
          key={item.id}
          className="flex gap-3 border border-[var(--plum)]/10 bg-[var(--ivory)] p-3"
        >
          <Link href={`/shop/${item.slug}`} className="shrink-0">
            <ProductMedia
              name={item.nameAr}
              imageTone={item.imageTone}
              imageUrl={item.imageUrl}
              aspectClassName="h-20 w-16 aspect-auto"
              sizes="64px"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="t1 text-[var(--muted)]">
              {categoryLabels[item.category] ?? item.category}
            </p>
            <Link href={`/shop/${item.slug}`}>
              <h3 className="font-display t4 font-medium text-[var(--plum)]">
                {item.nameAr}
              </h3>
            </Link>
            <p className="t1 text-[var(--muted)]" dir="ltr">
              {item.name}
            </p>
            <div className="t3 mt-1 font-medium">
              <ProductPrice
                size="sm"
                price={item.price}
                originalPrice={item.originalPrice}
                discountPercent={item.discountPercent}
              />
              <span className="text-[var(--muted)]"> · {item.size}</span>
            </div>
            {!compact ? (
              <p className="t2 mt-1 line-clamp-2 text-[var(--ink)]/60">
                {item.benefitsAr.join(" · ")}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={`/shop/${item.slug}`}>
                <Button variant="ghost" className="!px-3 !py-1.5">
                  التفاصيل
                </Button>
              </Link>
              <Button
                variant="outline"
                className="!px-3 !py-1.5"
                onClick={() => addItem(toProduct(item))}
              >
                أضيفي للحقيبة
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function collectRecommendationsFromMessages(
  messages: Array<{ parts?: Array<Record<string, unknown>> }>,
): RecommendedProduct[] {
  const map = new Map<string, RecommendedProduct>();

  for (const message of messages) {
    for (const part of message.parts ?? []) {
      if (part.type !== "tool-recommendProducts") continue;
      if (part.state !== "output-available") continue;
      const output = part.output as {
        products?: RecommendedProduct[];
      } | null;
      for (const p of output?.products ?? []) {
        map.set(p.id, p);
      }
    }
  }

  return Array.from(map.values());
}
