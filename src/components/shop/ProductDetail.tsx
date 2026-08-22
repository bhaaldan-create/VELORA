"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { IconWhatsApp } from "@/components/contact/SocialIcons";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { WishlistHeartButton } from "@/components/shop/WishlistHeartButton";
import { categoryLabels, ui } from "@/constants/brand";
import { getProductWhatsAppUrl } from "@/lib/social-links";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { locale } = useLocale();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const ar = locale !== "en";
  const waProductUrl = getProductWhatsAppUrl(product, ar ? "ar" : "en");

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-20">
      <div className="relative">
        <WishlistHeartButton
          productId={product.id}
          className="absolute top-4 end-4 rounded-full bg-[var(--ivory)]/90 backdrop-blur-sm"
        />
        <ProductMedia
          name={product.nameAr}
          imageTone={product.imageTone}
          imageUrl={product.imageUrl}
          aspectClassName="aspect-[4/5]"
          className="w-full animate-[velora-fade_1s_ease-out_both]"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      <div className="animate-[velora-rise_0.9s_0.15s_ease-out_both]">
        <Link
          href={`/shop?category=${product.category}`}
          className="t1 font-medium tracking-[0.14em] text-[var(--muted)]"
        >
          {categoryLabels[product.category]}
        </Link>
        <h1 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
          {product.nameAr}
        </h1>
        <p className="t3 mt-1 text-[var(--muted)]" dir="ltr">
          {product.name}
        </p>
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <ProductPrice
            size="lg"
            price={product.price}
            originalPrice={product.originalPrice}
            discountPercent={product.discountPercent}
          />
          <span className="t3 text-[var(--muted)]">· {product.size}</span>
        </div>
        <p className="t3 mt-2 text-[var(--muted)]">
          ★ {product.rating} · {product.reviews.toLocaleString("ar-IQ")}{" "}
          {ui.reviews}
        </p>

        <p className="t4 mt-8 text-[var(--ink)]/75">{product.descriptionAr}</p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {product.benefitsAr.map((b) => (
            <li
              key={b}
              className="t2 bg-[var(--mist)] px-3 py-1.5 text-[var(--plum)]"
            >
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-[var(--plum)]/20">
            <button
              type="button"
              className="px-4 py-3 text-[var(--plum)]"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="تقليل الكمية"
            >
              −
            </button>
            <span className="t3 min-w-8 text-center">{qty}</span>
            <button
              type="button"
              className="px-4 py-3 text-[var(--plum)]"
              onClick={() => setQty((q) => q + 1)}
              aria-label="زيادة الكمية"
            >
              +
            </button>
          </div>
          <Button onClick={handleAdd} className="min-w-[160px]">
            {added ? ui.added : ui.addToBag}
          </Button>
          {waProductUrl ? (
            <a
              href={waProductUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="t2 inline-flex min-h-[48px] min-w-[160px] items-center justify-center gap-2 border border-[var(--plum)]/20 bg-transparent px-5 py-3 font-medium tracking-[0.04em] text-[var(--plum)] transition-all duration-300 hover:border-[var(--plum)]/40 hover:bg-[var(--mist)]/60"
              aria-label={ar ? "اطلبي عبر WhatsApp" : "Order via WhatsApp"}
              title={ar ? "اطلبي عبر WhatsApp" : "Order via WhatsApp"}
            >
              <IconWhatsApp size={16} className="text-[#3d8b6e]" />
              {ar ? "اطلبي عبر WhatsApp" : "Order via WhatsApp"}
            </a>
          ) : null}
        </div>

        <div className="mt-12 border-t border-[var(--plum)]/10 pt-8">
          <h2 className="t1 font-medium tracking-[0.14em] text-[var(--muted)]">
            {ui.keyIngredients}
          </h2>
          <p className="t3 mt-3 text-[var(--ink)]/70" dir="ltr">
            {product.ingredients.join(" · ")}
          </p>
        </div>

        <p className="t3 mt-8 text-[var(--muted)]">
          {ui.needHelp}{" "}
          <Link
            href="/advisor"
            className="text-[var(--plum)] underline underline-offset-4"
          >
            {ui.askAdvisor}
          </Link>
        </p>
      </div>
    </div>
  );
}
