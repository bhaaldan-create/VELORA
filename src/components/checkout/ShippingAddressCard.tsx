import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconEdit, IconMapPin } from "@/components/checkout/CheckoutIcons";
import "./checkout-wizard.css";

type Props = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  onEdit: () => void;
  editing?: boolean;
  onRestore?: () => void;
  showRestore?: boolean;
};

export function ShippingAddressCard({
  fullName,
  email,
  phone,
  address,
  onEdit,
  editing,
  onRestore,
  showRestore,
}: Props) {
  return (
    <section
      className="checkout-wizard cw-panel"
      aria-label="بيانات الشحن"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--plum)]/10 bg-[var(--mist)]/55 text-[var(--plum)]">
            <IconMapPin />
          </span>
          <div>
            <h2 className="cw-panel__title text-[1.25rem]">بيانات الشحن</h2>
            <p className="cw-panel__sub mt-1">معلومات التوصيل الخاصة بطلبك</p>
          </div>
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={onEdit}
            className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-[var(--plum)]/12 bg-[var(--mist)]/40 px-3.5 text-[0.78rem] font-medium text-[var(--plum)] transition-opacity hover:opacity-80"
          >
            <span>تعديل البيانات</span>
            <IconEdit className="transition-transform duration-200 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
          </button>
        ) : showRestore && onRestore ? (
          <button type="button" onClick={onRestore} className="cw-restore">
            <RotateCcw size={14} strokeWidth={1.6} aria-hidden />
            استعادة من الحساب
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="mt-6 space-y-4 border-t border-[var(--plum)]/8 pt-5">
          <p className="font-display text-[1.15rem] font-medium text-[var(--ink)]">
            {fullName || "—"}
          </p>
          <div className="space-y-1">
            <p className="text-[0.9rem] text-[var(--muted)]" dir="ltr">
              {phone || "—"}
            </p>
            <p className="text-[0.9rem] text-[var(--muted)]" dir="ltr">
              {email || "—"}
            </p>
          </div>
          <p
            className={cn(
              "text-[1rem] leading-relaxed text-[var(--ink)]/90",
              !address && "text-[var(--muted)]",
            )}
          >
            {address || "أضيفي عنوان التوصيل"}
          </p>
        </div>
      ) : null}
    </section>
  );
}
