"use client";

import { ProductComposition } from "@/components/my-velora/ProductComposition";
import type { VeloraCardPayload, VeloraCardStyleKey } from "@/lib/my-velora/types";
import { CARD_STYLE_OPTIONS } from "@/lib/my-velora/types";
import { cn } from "@/lib/utils";

export const MY_VELORA_CARD_WIDTH = 1080;
export const MY_VELORA_CARD_HEIGHT = 1920;

type Props = {
  payload: VeloraCardPayload;
  styleKey?: VeloraCardStyleKey;
  locale?: "ar" | "en";
  qrDataUrl?: string | null;
  id?: string;
  className?: string;
};

export function VeloraSignatureCard({
  payload,
  styleKey = "signature",
  locale = "ar",
  qrDataUrl,
  id = "velora-my-card",
  className,
}: Props) {
  const ar = locale === "ar";
  const style =
    CARD_STYLE_OPTIONS.find((s) => s.key === styleKey) ?? CARD_STYLE_OPTIONS[0]!;

  return (
    <div
      id={id}
      className={cn("relative overflow-hidden bg-[#E8DDF0]", className)}
      style={{
        width: MY_VELORA_CARD_WIDTH,
        height: MY_VELORA_CARD_HEIGHT,
      }}
    >
      {/* Master background — fixed composition */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={style.backgroundUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        crossOrigin="anonymous"
        draggable={false}
      />

      {style.overlayClass ? (
        <div className={cn("pointer-events-none absolute inset-0", style.overlayClass)} />
      ) : null}

      {/* Zone B — dynamic subtitle (covers template default when theme differs) */}
      <div
        className="pointer-events-none absolute left-0 right-0 flex justify-center"
        style={{ top: "13.8%", height: "3.2%" }}
      >
        <p
          className="font-latin text-center text-[22px] font-medium tracking-[0.34em] text-[#5E4A66]"
          dir="ltr"
        >
          ✦ {ar ? payload.subtitleAr : payload.subtitleEn} ✦
        </p>
      </div>

      {/* Zone C — product showcase */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: "18.2%",
          left: "7.4%",
          width: "85.2%",
          height: "28.4%",
        }}
      >
        <ProductComposition products={payload.products} className="h-full w-full" />
      </div>

      {/* Zone E — Beauty Club points */}
      <div
        className="absolute flex flex-col items-center justify-end text-center"
        style={{
          top: "49.8%",
          right: "5.8%",
          width: "41%",
          height: "8.8%",
        }}
      >
        <p
          className="font-latin text-[92px] font-light leading-none tracking-tight text-[#3D2640]"
          dir="ltr"
        >
          +{payload.pointsEarned}
        </p>
      </div>

      {/* Zone F — products / brands stats */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "60.1%",
          right: "5.8%",
          width: "41%",
          height: "5.8%",
        }}
      >
        <div className="grid w-full grid-cols-2">
          <div className="text-center">
            <p className="font-latin text-[34px] font-semibold leading-none text-[#3D2640]">
              {payload.productCount}
            </p>
          </div>
          <div className="text-center">
            <p className="font-latin text-[34px] font-semibold leading-none text-[#3D2640]">
              {payload.brandCount}
            </p>
          </div>
        </div>
      </div>

      {/* Zone G — brand logos */}
      <div
        className="absolute flex flex-wrap items-center justify-center gap-x-[5%] gap-y-[3%] px-[4%]"
        style={{
          top: "67.8%",
          right: "5.8%",
          width: "41%",
          height: "9.5%",
        }}
      >
        {payload.brands.slice(0, 6).map((brand) =>
          brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={brand.name}
              src={brand.logoUrl}
              alt={brand.name}
              className="max-h-[42px] max-w-[28%] object-contain opacity-90"
              crossOrigin="anonymous"
              draggable={false}
            />
          ) : (
            <span
              key={brand.name}
              className="font-latin text-[13px] font-semibold uppercase tracking-[0.18em] text-[#4A384F]"
            >
              {brand.name}
            </span>
          ),
        )}
      </div>

      {/* Zone H — optional QR near Discover VELORA */}
      {payload.showQrCode && qrDataUrl ? (
        <div
          className="absolute flex flex-col items-center"
          style={{
            bottom: "11.8%",
            right: "8%",
            width: "14%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR"
            className="h-[88px] w-[88px] rounded-md bg-white/80 p-1"
            draggable={false}
          />
        </div>
      ) : null}
    </div>
  );
}
