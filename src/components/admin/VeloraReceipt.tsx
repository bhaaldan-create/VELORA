import { getPaymentMethod } from "@/data/payments";
import type { StoredOrder } from "@/lib/order-types";
import { resolveOrderTotal } from "@/lib/shipping";
import { socialLinks } from "@/lib/social-links";
import { getSiteOrigin } from "@/lib/wayl";
import { formatIqdLatin } from "@/lib/utils";
import {
  ReceiptFeather,
  ReceiptFlourish,
  ReceiptGoldStar,
  ReceiptIconGlobe,
  ReceiptIconInstagram,
  ReceiptIconWhatsApp,
  ReceiptSwanLarge,
  ReceiptSwanMark,
} from "@/components/admin/receipt/ReceiptDecorations";

const PLUM = "#3D2640";
const LAVENDER_BG = "#E8E0F0";
const GOLD = "#B8956B";
const ROW_COUNT = 10;

function IconCard() {
  return (
    <svg width="20" height="15" viewBox="0 0 24 18" fill="none" aria-hidden>
      <rect x="1" y="1" width="22" height="16" rx="2" stroke={PLUM} strokeWidth="1.5" />
      <path d="M1 6.5h22" stroke={PLUM} strokeWidth="1.5" />
      <path d="M5 12h5" stroke={PLUM} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="14" viewBox="0 0 24 18" fill="none" aria-hidden>
      <rect x="1" y="1" width="22" height="16" rx="1.5" stroke={PLUM} strokeWidth="1.5" />
      <path d="M2 3l10 7L22 3" stroke={PLUM} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="14" height="18" viewBox="0 0 18 24" fill="none" aria-hidden>
      <path
        d="M4 1.5h4.5l1.2 5.2-2.3 1.4a13 13 0 006.5 6.5l1.4-2.3 5.2 1.2V21a2 2 0 01-2.2 2A18.5 18.5 0 012 3.7 2 2 0 014 1.5z"
        stroke={PLUM}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="14" height="18" viewBox="0 0 20 26" fill="none" aria-hidden>
      <path d="M10 24s8-8.2 8-14A8 8 0 102 10c0 5.8 8 14 8 14z" stroke={PLUM} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.6" stroke={PLUM} strokeWidth="1.5" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 8h14l-1.2 12.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z" stroke={PLUM} strokeWidth="1.5" />
      <path d="M8.5 8V6.5a3.5 3.5 0 017 0V8" stroke={PLUM} strokeWidth="1.5" />
    </svg>
  );
}

function FieldLine({ value, className = "" }: { value?: string; className?: string }) {
  return (
    <div
      className={`min-h-[1.2rem] flex-1 border-b border-[${PLUM}]/50 px-1 pb-0.5 text-[13px] leading-snug text-[${PLUM}] ${className}`}
      style={{ borderColor: `${PLUM}88`, color: PLUM }}
      dir="ltr"
    >
      {value || "\u00A0"}
    </div>
  );
}

type Props = {
  order: StoredOrder;
};

/**
 * وصل VELORA الرسمي — مطابق لقالب RECEIPT الجديد (2026).
 */
export function VeloraReceipt({ order: entry }: Props) {
  const payment =
    entry.order.paymentMethodLabel ||
    getPaymentMethod(entry.order.paymentMethod as never)?.name ||
    entry.order.paymentMethod;

  const addressLines = [
    entry.order.address,
    entry.order.city || "",
    entry.order.fullName ? `Attn: ${entry.order.fullName}` : "",
  ].filter(Boolean);

  const rows = Array.from({ length: ROW_COUNT }, (_, i) => {
    const item = entry.order.items[i];
    if (!item) {
      return { item: "", qty: "", unit: "", total: "" };
    }
    return {
      item: `${item.nameAr || item.name}${item.size ? ` · ${item.size}` : ""}`,
      qty: String(item.quantity),
      unit: formatIqdLatin(item.price),
      total: formatIqdLatin(item.price * item.quantity),
    };
  });

  const siteHost = getSiteOrigin().replace(/^https?:\/\//, "");

  return (
    <article
      id="velora-receipt"
      className="receipt-sheet relative mx-auto box-border w-[850px] max-w-none overflow-hidden bg-white px-10 py-8 text-[#3D2640]"
      dir="ltr"
    >
      {/* Decorative background */}
      <ReceiptFeather
        className="pointer-events-none absolute -left-2 top-0 h-[11rem] w-[4.5rem] opacity-80"
      />
      <ReceiptFeather
        flip
        className="pointer-events-none absolute -right-2 bottom-16 h-[10rem] w-[4rem] opacity-70"
      />
      <ReceiptSwanLarge
        className="pointer-events-none absolute bottom-20 left-2 h-[5.5rem] w-[6.5rem] opacity-70"
      />

      {/* Header */}
      <header className="relative z-[1] flex items-start justify-between gap-6 pt-2">
        <div className="w-[7rem]" aria-hidden />

        <div className="flex flex-col items-center text-center">
          <ReceiptSwanMark className="h-9 w-10" />
          <h1 className="font-brand mt-1 text-[38px] leading-none tracking-[0.1em] text-[#3D2640]">
            VELORA
          </h1>
          <div className="mt-2 flex w-[12rem] items-center gap-2">
            <span className="h-px flex-1 bg-[#3D2640]/70" />
            <span className="text-[8px] font-medium tracking-[0.24em] text-[#3D2640]">
              BEAUTY REVEALED
            </span>
            <span className="h-px flex-1 bg-[#3D2640]/70" />
          </div>
        </div>

        <div className="min-w-[11rem] pt-0 text-right">
          <div className="flex items-start justify-end gap-1">
            <ReceiptGoldStar className="mt-1 h-3 w-3" />
            <p className="text-[26px] font-semibold tracking-[0.1em] text-[#3D2640]">
              RECEIPT
            </p>
          </div>
          <div className="mt-2 flex items-end justify-end gap-2">
            <span className="pb-0.5 text-[11px] font-semibold tracking-[0.14em]">
              NO.
            </span>
            <FieldLine value={entry.orderId} className="max-w-[9.5rem] text-left" />
          </div>
        </div>
      </header>

      <div className="relative z-[1] mt-6 h-px w-full bg-[#3D2640]/25" />

      {/* Payment + total */}
      <div className="relative z-[1] mt-5 grid grid-cols-2 gap-10">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#3D2640]">
            PAYMENT METHOD
          </p>
          <div className="mt-2.5 flex items-end gap-2">
            <IconCard />
            <FieldLine value={payment} />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#3D2640]">
            TOTAL AMOUNT
          </p>
          <div className="mt-2.5 flex items-end gap-2">
            <span className="pb-0.5 text-[11px] font-bold tracking-[0.12em]">IQD</span>
            <FieldLine value={formatIqdLatin(resolveOrderTotal(entry.order))} />
          </div>
        </div>
      </div>

      {/* Customer box */}
      <div
        className="relative z-[1] mt-6 grid grid-cols-[1fr_auto_1fr] gap-0 rounded-[18px] border border-[#3D2640]/30 px-5 py-5"
        style={{ background: "linear-gradient(180deg, #faf8fc 0%, #fff 100%)" }}
      >
        <div className="space-y-5 pe-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em]">EMAIL</p>
            <div className="mt-2 flex items-end gap-2">
              <IconMail />
              <FieldLine value={entry.order.email} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em]">PHONE NUMBER</p>
            <div className="mt-2 flex items-end gap-2">
              <IconPhone />
              <FieldLine value={entry.order.phone} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-3">
          <div className="h-full w-px bg-[#3D2640]/20" />
          <ReceiptFlourish className="my-2 h-6 w-4" />
          <div className="h-full w-px bg-[#3D2640]/20" />
        </div>

        <div className="ps-4">
          <p className="text-[10px] font-bold tracking-[0.18em]">ADDRESS</p>
          <div className="mt-2 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">
              <IconPin />
            </span>
            <div className="flex w-full flex-col gap-2">
              <FieldLine value={addressLines[0]} />
              <FieldLine value={addressLines[1]} />
              <FieldLine value={addressLines[2]} />
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="relative z-[1] mt-7">
        <div className="mb-3 flex items-center gap-2">
          <IconBag />
          <p className="text-[11px] font-bold tracking-[0.16em]">ORDERED ITEMS</p>
        </div>

        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr style={{ backgroundColor: LAVENDER_BG }}>
              <th
                className="px-3 py-2.5 text-left font-bold tracking-[0.1em]"
                style={{ color: PLUM }}
              >
                ITEM
              </th>
              <th
                className="px-2 py-2.5 text-center font-bold tracking-[0.1em] w-16"
                style={{ color: PLUM }}
              >
                QTY
              </th>
              <th
                className="px-2 py-2.5 text-right font-bold tracking-[0.1em] w-28"
                style={{ color: PLUM }}
              >
                UNIT PRICE
              </th>
              <th
                className="px-3 py-2.5 text-right font-bold tracking-[0.1em] w-28"
                style={{ color: PLUM }}
              >
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`row-${idx}`}
                className="border-b border-dotted border-[#3D2640]/20"
              >
                <td className="h-9 px-3 align-middle">{row.item || "\u00A0"}</td>
                <td className="h-9 px-2 text-center align-middle">
                  {row.qty || "\u00A0"}
                </td>
                <td className="h-9 px-2 text-right align-middle">
                  {row.unit || "\u00A0"}
                </td>
                <td className="h-9 px-3 text-right align-middle">
                  {row.total || "\u00A0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Thank you */}
      <div className="relative z-[1] mt-8 text-center">
        <p className="text-[11px] font-bold tracking-[0.16em] text-[#3D2640]">
          THANK YOU FOR CHOOSING VELORA
        </p>
        <p
          className="font-brand mt-2 text-[22px] italic tracking-[0.04em]"
          style={{ color: GOLD }}
        >
          Beauty, Elegance, You.
        </p>
      </div>

      {/* Contact bar */}
      <footer
        className="relative z-[1] mt-6 flex items-center justify-between gap-4 rounded-full px-6 py-3 text-[10px] font-semibold tracking-[0.08em] text-white"
        style={{ backgroundColor: "#C9B8D9" }}
      >
        <span className="flex items-center gap-2">
          <ReceiptIconInstagram className="h-4 w-4 shrink-0" />
          <span>{socialLinks.instagram.handle}</span>
        </span>
        <span className="flex items-center gap-2">
          <ReceiptIconWhatsApp className="h-4 w-4 shrink-0" />
          <span dir="ltr">{socialLinks.whatsapp.phoneLocal}</span>
        </span>
        <span className="flex items-center gap-2">
          <ReceiptIconGlobe className="h-4 w-4 shrink-0" />
          <span>{siteHost}</span>
        </span>
      </footer>
    </article>
  );
}
