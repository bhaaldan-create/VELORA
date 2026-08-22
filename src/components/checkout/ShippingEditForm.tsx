import { cn } from "@/lib/utils";
import { IconPenLine } from "@/components/checkout/CheckoutIcons";

const fieldClass =
  "t3 w-full rounded-[14px] border border-[var(--plum)]/10 bg-[var(--ivory)]/60 px-4 py-3 text-[var(--ink)] outline-none transition-colors duration-200 placeholder:text-[var(--muted)]/70 focus:border-[var(--plum)]/35 focus:bg-[var(--surface)] disabled:opacity-60";

const labelClass =
  "t2 mb-2 block font-medium tracking-[0.04em] text-[var(--muted)]";

type Props = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  disabled?: boolean;
  onFullNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  className?: string;
  showHeading?: boolean;
};

export function ShippingEditForm({
  fullName,
  email,
  phone,
  address,
  disabled,
  onFullNameChange,
  onEmailChange,
  onPhoneChange,
  onAddressChange,
  className,
  showHeading = true,
}: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      {showHeading ? (
        <div className="mb-1">
          <h2 className="font-display text-[1.25rem] font-medium text-[var(--plum)]">
            بيانات الشحن
          </h2>
          <p className="t3 mt-1 text-[var(--muted)]">
            معلومات التوصيل الخاصة بطلبك
          </p>
        </div>
      ) : null}

      <label className="block">
        <span className={labelClass}>الاسم الكامل</span>
        <input
          name="fullName"
          required
          disabled={disabled}
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          className={fieldClass}
          autoComplete="name"
        />
      </label>

      <label className="block">
        <span className={labelClass}>البريد الإلكتروني</span>
        <input
          name="email"
          type="email"
          required
          disabled={disabled}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          dir="ltr"
          className={cn(fieldClass, "text-start")}
          autoComplete="email"
        />
      </label>

      <label className="block">
        <span className={labelClass}>رقم الهاتف</span>
        <input
          name="phone"
          required
          disabled={disabled}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="07XXXXXXXXX"
          pattern="07[0-9]{9}"
          title="رقم جوال عراقي: 07XXXXXXXXX"
          dir="ltr"
          className={cn(fieldClass, "text-start")}
          autoComplete="tel"
        />
      </label>

      <label className="block">
        <span className={labelClass}>العنوان</span>
        <textarea
          name="address"
          required
          rows={3}
          disabled={disabled}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="المحافظة، المنطقة، أقرب نقطة دالة…"
          className={cn(fieldClass, "resize-none leading-relaxed")}
          autoComplete="street-address"
        />
      </label>
    </div>
  );
}

type NotesProps = {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
};

export function CheckoutNotesField({ value, disabled, onChange }: NotesProps) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 t2 font-medium tracking-[0.04em] text-[var(--muted)]">
        <IconPenLine className="text-[var(--plum)]/70" />
        ملاحظات (اختياري)
      </span>
      <textarea
        name="notes"
        rows={3}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="مثلاً: وقت التوصيل المفضل، تفاصيل الموقع، أو أي ملاحظات أخرى…"
        className={cn(
          fieldClass,
          "mt-2.5 resize-none leading-relaxed",
        )}
      />
    </label>
  );
}
