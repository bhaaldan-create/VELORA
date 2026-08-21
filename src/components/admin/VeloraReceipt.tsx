import { getPaymentMethod } from "@/data/payments";
import type { StoredOrder } from "@/lib/order-types";
import { resolveOrderTotal } from "@/lib/shipping";
import { formatIqdLatin } from "@/lib/utils";

const PLUM = "#3D2640";
const ROW_COUNT = 8;

function IconCard({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="14"
      viewBox="0 0 24 18"
      fill="none"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="22"
        height="16"
        rx="2"
        stroke={PLUM}
        strokeWidth="1.6"
      />
      <path d="M1 6.5h22" stroke={PLUM} strokeWidth="1.6" />
      <path d="M5 12h5" stroke={PLUM} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="14"
      viewBox="0 0 24 18"
      fill="none"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="22"
        height="16"
        rx="1.5"
        stroke={PLUM}
        strokeWidth="1.6"
      />
      <path
        d="M2 3l10 7L22 3"
        stroke={PLUM}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="16"
      viewBox="0 0 18 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 1.5h4.5l1.2 5.2-2.3 1.4a13 13 0 006.5 6.5l1.4-2.3 5.2 1.2V21a2 2 0 01-2.2 2A18.5 18.5 0 012 3.7 2 2 0 014 1.5z"
        stroke={PLUM}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="18"
      viewBox="0 0 20 26"
      fill="none"
      aria-hidden
    >
      <path
        d="M10 24s8-8.2 8-14A8 8 0 102 10c0 5.8 8 14 8 14z"
        stroke={PLUM}
        strokeWidth="1.6"
      />
      <circle cx="10" cy="10" r="2.6" stroke={PLUM} strokeWidth="1.6" />
    </svg>
  );
}

function IconBag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 8h14l-1.2 12.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z"
        stroke={PLUM}
        strokeWidth="1.6"
      />
      <path
        d="M8.5 8V6.5a3.5 3.5 0 017 0V8"
        stroke={PLUM}
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill={PLUM}
      aria-hidden
    >
      <path d="M8 0l1.4 5.4L16 8l-6.6 1.4L8 16l-1.4-6.6L0 8l6.6-1.4L8 0z" />
    </svg>
  );
}

function FieldLine({
  value,
  className = "",
}: {
  value?: string;
  className?: string;
}) {
  return (
    <div
      className={`min-h-[1.15rem] flex-1 border-b border-[color:var(--receipt-plum)]/55 px-1 pb-0.5 text-[13px] leading-tight text-[color:var(--receipt-plum)] ${className}`}
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
 * وصل VELORA مطابق لقالب RECEIPT الرسمي — يُملأ تلقائياً من بيانات الطلب.
 */
export function VeloraReceipt({ order: entry }: Props) {
  const payment =
    getPaymentMethod(entry.order.paymentMethod as never)?.name ||
    entry.order.paymentMethodLabel;

  const addressLines = [
    entry.order.address,
    entry.order.fullName ? `Attn: ${entry.order.fullName}` : "",
  ].filter(Boolean);

  const rows = Array.from({ length: ROW_COUNT }, (_, i) => {
    const item = entry.order.items[i];
    if (!item) {
      return { item: "", quantity: "", price: "", total: "" };
    }
    const lineTotal = item.price * item.quantity;
    return {
      item: `${item.name}${item.size ? ` · ${item.size}` : ""}`,
      quantity: String(item.quantity),
      price: formatIqdLatin(item.price),
      total: formatIqdLatin(lineTotal),
    };
  });

  return (
    <article
      id="velora-receipt"
      className="receipt-sheet mx-auto box-border w-[850px] max-w-none overflow-visible bg-white px-10 py-9 text-[color:var(--receipt-plum)]"
      style={{ ["--receipt-plum" as string]: PLUM }}
      dir="ltr"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1
            className="font-brand text-[42px] leading-none tracking-[0.08em]"
            style={{ color: PLUM }}
          >
            VELORA
          </h1>
          <div className="mt-2 flex w-[11.5rem] items-center gap-2">
            <span className="h-px flex-1 bg-[color:var(--receipt-plum)]" />
            <span className="text-[9px] font-medium tracking-[0.22em]">
              BEAUTY REVEALED
            </span>
            <span className="h-px flex-1 bg-[color:var(--receipt-plum)]" />
          </div>
        </div>

        <div className="min-w-[10.5rem] pt-1 text-right">
          <p className="text-[28px] font-semibold tracking-[0.12em]">RECEIPT</p>
          <div className="mt-3 flex items-end justify-end gap-2">
            <span className="pb-0.5 text-[12px] font-semibold tracking-[0.14em]">
              NO.
            </span>
            <FieldLine value={entry.orderId} className="max-w-[9rem] text-left" />
          </div>
        </div>
      </header>

      <div className="mt-7 h-px w-full bg-[color:var(--receipt-plum)]" />

      {/* Payment + Total — دائماً عمودان مثل القالب (بدون sm: حتى لا تتشوه صورة التصدير) */}
      <div className="mt-5 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em]">
            PAYMENT METHOD
          </p>
          <div className="mt-3 flex items-end gap-2">
            <IconCard className="mb-1 shrink-0" />
            <FieldLine value={payment} />
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em]">
            TOTAL AMOUNT
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="pb-0.5 text-[12px] font-semibold tracking-[0.12em]">
              IQD
            </span>
            <FieldLine value={formatIqdLatin(resolveOrderTotal(entry.order))} />
          </div>
        </div>
      </div>

      {/* Customer box */}
      <div className="mt-6 grid grid-cols-2 gap-8 border border-[color:var(--receipt-plum)]/35 px-5 py-5">
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em]">EMAIL</p>
            <div className="mt-2 flex items-end gap-2">
              <IconMail className="mb-1 shrink-0" />
              <FieldLine value={entry.order.email} />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em]">
              PHONE NUMBER
            </p>
            <div className="mt-2 flex items-end gap-2">
              <IconPhone className="mb-1 shrink-0" />
              <FieldLine value={entry.order.phone} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em]">ADDRESS</p>
          <div className="mt-2 flex items-start gap-2">
            <IconPin className="mt-1 shrink-0" />
            <div className="flex w-full flex-col gap-2">
              <FieldLine value={addressLines[0]} />
              <FieldLine value={addressLines[1]} />
              <FieldLine value={addressLines[2]} />
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-7">
        <div className="mb-3 flex items-center gap-2">
          <IconBag />
          <p className="text-[12px] font-semibold tracking-[0.16em]">
            ORDERED ITEMS
          </p>
        </div>

        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[color:var(--receipt-plum)] text-white">
              <th className="px-3 py-2.5 text-left font-semibold tracking-[0.12em]">
                ITEM
              </th>
              <th className="px-2 py-2.5 text-center font-semibold tracking-[0.12em]">
                QUANTITY
              </th>
              <th className="px-2 py-2.5 text-right font-semibold tracking-[0.12em]">
                PRICE
              </th>
              <th className="px-3 py-2.5 text-right font-semibold tracking-[0.12em]">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`row-${idx}`}
                className="border-b border-[color:var(--receipt-plum)]/25"
              >
                <td className="h-9 px-3 align-middle">{row.item || "\u00A0"}</td>
                <td className="h-9 px-2 text-center align-middle">
                  {row.quantity || "\u00A0"}
                </td>
                <td className="h-9 px-2 text-right align-middle">
                  {row.price || "\u00A0"}
                </td>
                <td className="h-9 px-3 text-right align-middle">
                  {row.total || "\u00A0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <footer className="mt-8 flex items-center justify-between gap-3 border border-[color:var(--receipt-plum)]/35 px-4 py-3 text-[11px] font-semibold tracking-[0.14em]">
        <span>THANK YOU FOR CHOOSING VELORA</span>
        <IconSpark />
        <span>BEAUTY REVEALED</span>
      </footer>
    </article>
  );
}
