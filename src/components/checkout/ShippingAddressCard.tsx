import { cn } from "@/lib/utils";
import { IconEdit, IconMapPin } from "@/components/checkout/CheckoutIcons";

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
      className="rounded-[20px] border border-[var(--plum)]/8 bg-[var(--surface)] p-5 shadow-[0_4px_24px_-12px_rgba(61,38,64,0.08)] sm:p-6"
      aria-label="بيانات الشحن"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--plum)]/8 bg-[var(--mist)]/60 text-[var(--plum)]">
            <IconMapPin />
          </span>
          <div>
            <h2 className="font-display text-[1.25rem] font-medium text-[var(--plum)]">
              بيانات الشحن
            </h2>
            <p className="t3 mt-1 text-[var(--muted)]">
              معلومات التوصيل الخاصة بطلبك
            </p>
          </div>
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={onEdit}
            className="group inline-flex shrink-0 items-center gap-1.5 t2 font-medium text-[var(--plum)] transition-opacity hover:opacity-75"
          >
            <span>تعديل البيانات</span>
            <IconEdit className="transition-transform duration-200 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
          </button>
        ) : showRestore ? (
          <button
            type="button"
            onClick={onRestore}
            className="t2 shrink-0 font-medium text-[var(--plum)]/80 underline-offset-4 transition-opacity hover:opacity-75 hover:underline"
          >
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
            <p className="t3 text-[var(--muted)]" dir="ltr">
              {phone || "—"}
            </p>
            <p className="t3 text-[var(--muted)]" dir="ltr">
              {email || "—"}
            </p>
          </div>
          <p
            className={cn(
              "t4 leading-relaxed text-[var(--ink)]/90",
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
