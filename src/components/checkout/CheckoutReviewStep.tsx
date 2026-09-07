"use client";

import Image from "next/image";
import { type ReactNode } from "react";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { storefrontProductCardImageUrl } from "@/lib/catalog-mapper";
import { getProductBrand } from "@/lib/product-brand";
import { formatPrice, cn } from "@/lib/utils";
import { WASEET_CARRIER } from "@/lib/shipping";
import type { PaymentMethod } from "@/data/payments";
import type { CartItem } from "@/types";
import { CheckoutFlowCta } from "@/components/checkout/CheckoutFlowCta";
import "./checkout-review.css";

type Props = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod | undefined;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  onEditShipping: () => void;
  onEditPayment: () => void;
  onConfirm: () => void;
  hideInlineConfirm?: boolean;
};

function resolveReviewImageUrl(product: CartItem["product"]) {
  const stored = product.imageUrl?.trim();
  if (stored) return stored;
  return storefrontProductCardImageUrl(product.id);
}

/** Soft icons scoped to Review — does not change shared CheckoutIcons */
function SoftIcon({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function IconPinSoft({ className }: { className?: string }) {
  return (
    <SoftIcon className={className}>
      <path d="M12 20.2c1.9-1.8 5.8-5.7 5.8-9.6a5.8 5.8 0 1 0-11.6 0c0 3.9 3.9 7.8 5.8 9.6Z" />
      <circle cx="12" cy="10.6" r="2" />
    </SoftIcon>
  );
}

function IconPaySoft({ className }: { className?: string }) {
  return (
    <SoftIcon className={className}>
      <rect x="3.5" y="6" width="17" height="12" rx="3" />
      <path d="M3.5 10.2h17" />
      <path d="M8 14.2h3.2" />
    </SoftIcon>
  );
}

function IconBagSoft({ className }: { className?: string }) {
  return (
    <SoftIcon className={className}>
      <rect x="4.5" y="7.2" width="15" height="12" rx="3" />
      <path d="M4.5 11h15" />
      <path d="M12 7.2v12" />
      <path d="M9.4 7.2c0-1.3 1.2-2.3 2.6-2.3s2.6 1 2.6 2.3" />
    </SoftIcon>
  );
}

function IconTruckSoft({ className }: { className?: string }) {
  return (
    <SoftIcon className={className}>
      <path d="M13.2 16.8V7.5c0-.8-.6-1.4-1.4-1.4H5.4c-.8 0-1.4.6-1.4 1.4v8.5c0 .4.3.8.8.8h1.4" />
      <path d="M13.8 16.8H9.6" />
      <path d="M17.4 16.8h1.6c.4 0 .8-.4.8-.8v-2.9c0-.2-.1-.4-.2-.6l-2.1-2c-.2-.1-.4-.2-.6-.2h-3.1" />
      <circle cx="7.4" cy="16.8" r="1.5" />
      <circle cx="15.8" cy="16.8" r="1.5" />
    </SoftIcon>
  );
}

function IconEditSoft({ className }: { className?: string }) {
  return (
    <SoftIcon className={className}>
      <path d="M12.5 19.5h7" />
      <path d="M15.8 4.8a1.9 1.9 0 0 1 2.7 2.7L8.2 18l-3.4.7.7-3.4Z" />
    </SoftIcon>
  );
}

export function CheckoutReviewStep({
  fullName,
  email,
  phone,
  address,
  paymentMethod,
  items,
  subtotal,
  deliveryFee,
  total,
  onEditShipping,
  onEditPayment,
  onConfirm,
  hideInlineConfirm,
}: Props) {
  const isWayl = paymentMethod?.id === "wayl";

  return (
    <div className="checkout-review space-y-5 sm:space-y-6">
      <header className="cr-head">
        <h2 className="cr-head__title">مراجعة الطلب</h2>
        <p className="cr-head__sub">راجعي تفاصيلكِ بهدوء قبل التأكيد النهائي</p>
      </header>

      <ReviewSection
        title="بيانات الشحن"
        icon={<IconPinSoft />}
        onEdit={onEditShipping}
      >
        <p className="cr-meta__name">{fullName}</p>
        <p className="cr-meta__line" dir="ltr">
          {email}
        </p>
        <p className="cr-meta__line" dir="ltr">
          {phone}
        </p>
        <p className="cr-meta__address">{address}</p>
      </ReviewSection>

      <ReviewSection
        title="طريقة الدفع"
        icon={
          isWayl ? (
            <Image
              src={paymentMethod?.logo ?? "/payments/wayl.svg"}
              alt="Wayl"
              width={40}
              height={16}
              className="h-3.5 w-auto object-contain"
            />
          ) : (
            <IconPaySoft />
          )
        }
        onEdit={onEditPayment}
      >
        <p className="cr-meta__name">{paymentMethod?.nameAr ?? "—"}</p>
        <p className="cr-meta__line" dir="ltr">
          {paymentMethod?.name ?? "—"}
        </p>
      </ReviewSection>

      <ReviewSection title="المنتجات" icon={<IconBagSoft />}>
        <ul className="cr-products">
          {items.map(({ product, quantity }) => {
            const brand = getProductBrand(product.name, product.nameAr);
            const lineTotal = product.price * quantity;
            const imageUrl = resolveReviewImageUrl(product);
            const metaParts = [
              product.size || null,
              `الكمية ${quantity}`,
            ].filter(Boolean);

            return (
              <li key={product.id} className="cr-product">
                <div className="cr-product__media">
                  <ProductMedia
                    name={product.nameAr}
                    imageTone={product.imageTone}
                    imageUrl={imageUrl}
                    aspectClassName="h-full w-full"
                    className="!h-full !w-full"
                    imageClassName="cr-product__photo"
                    fit="cover"
                    sizes="84px"
                  />
                </div>
                <div className="cr-product__body">
                  <p className="cr-product__brand" dir="ltr">
                    {brand}
                  </p>
                  <p className="cr-product__name">{product.nameAr}</p>
                  <div className="cr-product__foot">
                    <p className="cr-product__meta">{metaParts.join(" · ")}</p>
                    <p className="cr-product__price font-price">
                      {formatPrice(lineTotal)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </ReviewSection>

      <ReviewSection title="التوصيل" icon={<IconTruckSoft />}>
        <div className="cr-ship">
          <div className="min-w-0">
            <p className="cr-meta__name">{WASEET_CARRIER.nameAr}</p>
            <p className="cr-meta__line">
              {deliveryFee > 0 ? (
                <>
                  أجور التوصيل:{" "}
                  <span className="font-price">{formatPrice(deliveryFee)}</span>
                </>
              ) : (
                "التوصيل مجاني"
              )}
            </p>
          </div>
          <span className="cr-ship__badge">
            <Image
              src={WASEET_CARRIER.logoBadge}
              alt={WASEET_CARRIER.nameEn}
              width={72}
              height={20}
              className="h-[15px] w-auto object-contain"
            />
          </span>
        </div>
      </ReviewSection>

      <div className="cr-totals">
        <dl>
          <div className="cr-totals__row">
            <dt className="cr-totals__label">المجموع الفرعي</dt>
            <dd className="cr-totals__value font-price">
              {formatPrice(subtotal)}
            </dd>
          </div>
          <div className="cr-totals__row">
            <dt className="cr-totals__label">أجور التوصيل</dt>
            <dd className="cr-totals__value font-price">
              {deliveryFee > 0 ? formatPrice(deliveryFee) : "التوصيل مجاني"}
            </dd>
          </div>
        </dl>
        <div className="cr-totals__rule" role="separator" aria-hidden />
        <div className="cr-totals__row">
          <span className="cr-totals__grand-label">الإجمالي</span>
          <span className="cr-totals__grand-value font-price">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {!hideInlineConfirm ? (
        <div className="pt-1">
          <CheckoutFlowCta
            action="confirm"
            onClick={onConfirm}
            showTotal
            total={total}
          />
          <p className="cr-confirm-note">
            بمجرد تأكيد الطلب، سيبدأ فريق VELORA بتجهيزه.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ReviewSection({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: ReactNode;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="cr-section">
      <div className="cr-section__head">
        <div className="cr-section__title-wrap">
          <span className="cr-section__icon">{icon}</span>
          <h3 className="cr-section__title">{title}</h3>
        </div>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="cr-edit">
            <span>تعديل</span>
            <IconEditSoft />
          </button>
        ) : null}
      </div>
      <div className="cr-section__body">{children}</div>
    </section>
  );
}
