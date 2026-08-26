"use client";

import { ProductComposition } from "@/components/my-velora/ProductComposition";
import type { VeloraCardPayload, VeloraCardStyleKey } from "@/lib/my-velora/types";
import { CARD_STYLE_OPTIONS } from "@/lib/my-velora/types";
import { cn } from "@/lib/utils";

export const MY_VELORA_CARD_WIDTH = 1080;
export const MY_VELORA_CARD_HEIGHT = 1920;
export const MY_VELORA_MASTER_BG =
  "/my-velora/templates/velora-signature-master.png";

type Props = {
  payload: VeloraCardPayload;
  styleKey?: VeloraCardStyleKey;
  locale?: "ar" | "en";
  qrDataUrl?: string | null;
  id?: string;
  className?: string;
  /** Optional pre-inlined master background (data URL) for reliable export */
  backgroundDataUrl?: string | null;
};

export function VeloraSignatureCard({
  payload,
  styleKey = "signature",
  locale = "ar",
  qrDataUrl,
  id = "velora-my-card",
  className,
  backgroundDataUrl,
}: Props) {
  const ar = locale === "ar";
  const style =
    CARD_STYLE_OPTIONS.find((s) => s.key === styleKey) ?? CARD_STYLE_OPTIONS[0]!;
  const bg = backgroundDataUrl || style.backgroundUrl || MY_VELORA_MASTER_BG;

  return (
    <div
      id={id}
      className={cn("relative overflow-hidden", className)}
      style={{
        width: MY_VELORA_CARD_WIDTH,
        height: MY_VELORA_CARD_HEIGHT,
        backgroundColor: "#E8DDF0",
        backgroundImage: `url("${bg}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "100% 100%",
      }}
      data-mv-card="true"
    >
      {/* Keep an img fallback for browsers that struggle with CSS bg in capture */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bg}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-fill"
        draggable={false}
        data-mv-bg="true"
      />

      {style.overlayClass ? (
        <div
          className={cn("pointer-events-none absolute inset-0", style.overlayClass)}
          aria-hidden
        />
      ) : null}

      {/* Zone B — dynamic subtitle */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 flex items-center justify-center"
        style={{ top: "13.6%", height: "3.4%" }}
      >
        <p
          className="font-latin text-center text-[22px] font-medium tracking-[0.28em] text-[#5E4A66]"
          dir="ltr"
          style={{ textShadow: "0 1px 0 rgba(255,255,255,0.35)" }}
        >
          ✦ {ar ? payload.subtitleAr : payload.subtitleEn} ✦
        </p>
      </div>

      {/* Zone C — product showcase */}
      <div
        className="absolute z-10 overflow-hidden"
        style={{
          top: "18.2%",
          left: "7.4%",
          width: "85.2%",
          height: "28.4%",
        }}
      >
        <ProductComposition products={payload.products} className="h-full w-full" />
      </div>

      {/* Zone E — Beauty Club points number */}
      <div
        className="absolute z-10 flex flex-col items-center justify-center text-center"
        style={{
          top: "49.2%",
          right: "5.8%",
          width: "41%",
          height: "9.2%",
        }}
      >
        <p
          className="font-latin font-light leading-none tracking-tight text-[#3D2640]"
          dir="ltr"
          style={{ fontSize: 84 }}
        >
          +{payload.pointsEarned}
        </p>
      </div>

      {/* Zone F — products / brands counts */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          top: "59.6%",
          right: "5.8%",
          width: "41%",
          height: "6%",
        }}
      >
        <div className="grid w-full grid-cols-2 gap-1">
          <div className="text-center">
            <p
              className="font-latin font-semibold leading-none text-[#3D2640]"
              style={{ fontSize: 32 }}
            >
              {payload.productCount}
            </p>
          </div>
          <div className="text-center">
            <p
              className="font-latin font-semibold leading-none text-[#3D2640]"
              style={{ fontSize: 32 }}
            >
              {payload.brandCount}
            </p>
          </div>
        </div>
      </div>

      {/* Zone G — brand logos */}
      <div
        className="absolute z-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4"
        style={{
          top: "67.5%",
          right: "5.8%",
          width: "41%",
          height: "9.8%",
        }}
      >
        {payload.brands.slice(0, 6).map((brand) =>
          brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={brand.name}
              src={brand.logoUrl}
              alt={brand.name}
              className="max-h-[40px] max-w-[28%] object-contain"
              draggable={false}
            />
          ) : (
            <span
              key={brand.name}
              className="font-latin text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4A384F]"
            >
              {brand.name}
            </span>
          ),
        )}
      </div>

      {/* Zone H — optional QR */}
      {payload.showQrCode && qrDataUrl ? (
        <div
          className="absolute z-10 flex flex-col items-center"
          style={{
            bottom: "11.5%",
            right: "8%",
            width: "14%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR"
            className="h-[88px] w-[88px] rounded-md bg-white p-1"
            draggable={false}
          />
        </div>
      ) : null}
    </div>
  );
}
