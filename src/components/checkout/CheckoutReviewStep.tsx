"use client";

import Image from "next/image";
import { type ReactNode } from "react";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { getProductBrand } from "@/lib/product-brand";
import { formatPrice } from "@/lib/utils";
import { WASEET_CARRIER } from "@/lib/shipping";
import type { PaymentMethod } from "@/data/payments";
import type { CartItem } from "@/types";
import { CheckoutFlowCta } from "@/components/checkout/CheckoutFlowCta";
import {
  IconCreditCard,
  IconEdit,
  IconMapPin,
  IconPackageCheck,
  IconTruck,
} from "@/components/checkout/CheckoutIcons";

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
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[1.5rem] font-medium text-[var(--plum)] sm:text-[1.65rem]">
          مراجعة الطلب
        </h2>
        <p className="t3 mt-1.5 text-[var(--muted)]">
          راجعي تفاصيل طلبك قبل التأكيد
        </p>
      </div>

      <ReviewSection
        title="بيانات الشحن"
        icon={<IconMapPin className="h-4 w-4" />}
        onEdit={onEditShipping}
      >
        <div className="space-y-2">
          <p className="t4 font-medium text-[var(--ink)]">{fullName}</p>
          <p className="t3 text-[var(--muted)]" dir="ltr">{email}</p>
          <p className="t3 text-[var(--muted)]" dir="ltr">{phone}</p>
          <p className="t4 leading-relaxed text-[var(--ink)]/85">{address}</p>
        </div>
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
              className="h-4 w-auto object-contain"
            />
          ) : (
            <IconCreditCard className="h-4 w-4" />
          )
        }
        onEdit={onEditPayment}
      >
        <p className="t4 font-medium text-[var(--ink)]">
          {paymentMethod?.nameAr ?? "—"}
        </p>
        <p className="t3 mt-0.5 text-[var(--muted)]" dir="ltr">
          {paymentMethod?.name ?? "—"}
        </p>
      </ReviewSection>

      <ReviewSection
        title="المنتجات"
        icon={<IconPackageCheck className="h-4 w-4" />}
      >
        <ul className="divide-y divide-[var(--plum)]/8">
          {items.map(({ product, quantity }) => {
            const brand = getProductBrand(product.name, product.nameAr);
            const lineTotal = product.price * quantity;

            return (
              <li
                key={product.id}
                className="flex gap-3 py-4 first:pt-0 last:pb-0"
              >
                <ProductMedia
                  name={product.nameAr}
                  imageTone={product.imageTone}
                  imageUrl={product.imageUrl}
                  aspectClassName="h-16 w-16 shrink-0"
                  className="rounded-[12px] border border-[var(--plum)]/6 bg-[var(--ivory)]"
                  sizes="64px"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="font-latin t1 font-medium tracking-[0.12em] text-[var(--muted)] uppercase"
                    dir="ltr"
                  >
                    {brand}
                  </p>
                  <p className="t4 mt-0.5 font-medium text-[var(--ink)]">
                    {product.nameAr}
                  </p>
                  {product.size ? (
                    <p className="t3 mt-0.5 text-[var(--muted)]">
                      {product.size}
                    </p>
                  ) : null}
                  <p className="t3 mt-1 text-[var(--muted)]">
                    الكمية: {quantity}
                  </p>
                </div>
                <p className="font-price t4 shrink-0 font-medium text-[var(--plum)]">
                  {formatPrice(lineTotal)}
                </p>
              </li>
            );
          })}
        </ul>
      </ReviewSection>

      <ReviewSection
        title="التوصيل"
        icon={<IconTruck className="h-4 w-4" />}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="t4 font-medium text-[var(--ink)]">
              {WASEET_CARRIER.nameAr}
            </p>
            <p className="t3 mt-0.5 text-[var(--muted)]">
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
          <span className="inline-flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#1B4F9C] px-1.5">
            <Image
              src={WASEET_CARRIER.logoBadge}
              alt={WASEET_CARRIER.nameEn}
              width={72}
              height={20}
              className="h-[16px] w-auto object-contain"
            />
          </span>
        </div>
      </ReviewSection>

      <div className="rounded-[18px] border border-[var(--plum)]/8 bg-[var(--surface)] p-5 sm:p-6">
        <dl className="space-y-3">
          <PriceRow label="المجموع الفرعي" value={formatPrice(subtotal)} />
          <PriceRow
            label="أجور التوصيل"
            value={
              deliveryFee > 0 ? formatPrice(deliveryFee) : "التوصيل مجاني"
            }
          />
        </dl>
        <div
          className="my-4 h-px bg-[var(--plum)]/10"
          role="separator"
          aria-hidden
        />
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-display text-[1.1rem] font-medium text-[var(--plum)]">
            الإجمالي
          </span>
          <span className="font-price text-[1.5rem] font-semibold text-[var(--plum)]">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {!hideInlineConfirm ? (
        <div className="space-y-3 pt-2">
          <CheckoutFlowCta
            action="confirm"
            onClick={onConfirm}
            showTotal
            total={total}
          />
          <p className="t2 text-center text-[var(--muted)]">
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
    <section
      className="rounded-[18px] border border-[var(--plum)]/8 bg-[var(--surface)]/80 p-5 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--plum)]/6 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--plum)]/8 bg-[var(--mist)]/50 text-[var(--plum)]">
            {icon}
          </span>
          <h3 className="t4 font-medium text-[var(--plum)]">{title}</h3>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="group inline-flex items-center gap-1 t2 font-medium text-[var(--muted)] transition-colors hover:text-[var(--plum)]"
          >
            <span>تعديل</span>
            <IconEdit className="opacity-70 transition-opacity group-hover:opacity-100" />
          </button>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="t3 text-[var(--muted)]">{label}</dt>
      <dd className="font-price t3 font-medium text-[var(--ink)]/90">{value}</dd>
    </div>
  );
}
