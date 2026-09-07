"use client";

import type { ReactNode } from "react";
import {
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "./checkout-wizard.css";

type FieldProps = {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  span?: boolean;
  textarea?: boolean;
  address?: boolean;
};

function FieldShell({
  label,
  icon,
  children,
  className,
  span,
  textarea,
  address,
}: FieldProps) {
  return (
    <label
      className={cn(
        "cw-field",
        textarea && "cw-field--textarea",
        address && "cw-field--address",
        span && "cw-field--span",
        className,
      )}
    >
      <span className="cw-field__shell">
        <span className="cw-field__icon" aria-hidden>
          {icon}
        </span>
        <span className="cw-field__body">
          <span className="cw-field__label">{label}</span>
          {children}
        </span>
      </span>
    </label>
  );
}

const iconProps = {
  size: 18,
  strokeWidth: 1.5,
  "aria-hidden": true as const,
};

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
    <div className={cn("checkout-wizard", className)}>
      {showHeading ? (
        <div className="cw-panel__head">
          <h2 className="cw-panel__title">بيانات الشحن</h2>
          <p className="cw-panel__sub">معلومات التوصيل الخاصة بطلبك</p>
        </div>
      ) : null}

      <div className="cw-stack cw-stack--split">
        <FieldShell
          label="الاسم الكامل"
          icon={<UserRound {...iconProps} />}
        >
          <input
            name="fullName"
            required
            disabled={disabled}
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="cw-field__control"
            autoComplete="name"
            placeholder="الاسم كما سيظهر على الطلب"
          />
        </FieldShell>

        <FieldShell label="البريد الإلكتروني" icon={<Mail {...iconProps} />}>
          <input
            name="email"
            type="email"
            required
            disabled={disabled}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            dir="ltr"
            className="cw-field__control text-start"
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
          />
        </FieldShell>

        <FieldShell label="رقم الهاتف" icon={<Phone {...iconProps} />}>
          <input
            name="phone"
            type="tel"
            required
            disabled={disabled}
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="07XXXXXXXXX"
            pattern="07[0-9]{9}"
            title="رقم جوال عراقي: 07XXXXXXXXX"
            dir="ltr"
            className="cw-field__control text-start"
            autoComplete="tel"
            inputMode="tel"
          />
        </FieldShell>

        <FieldShell
          label="العنوان"
          icon={<MapPin {...iconProps} />}
          span
          textarea
          address
        >
          <textarea
            name="address"
            required
            rows={4}
            disabled={disabled}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="المحافظة، المنطقة، أقرب نقطة دالة…"
            className="cw-field__control"
            autoComplete="street-address"
          />
        </FieldShell>
      </div>
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
    <div className="checkout-wizard">
      <div className="cw-notes">
        <FieldShell
          label="ملاحظات (اختياري)"
          icon={<MessageSquare {...iconProps} />}
          textarea
        >
          <textarea
            name="notes"
            rows={3}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="وقت التوصيل المفضل، تفاصيل الموقع، أو أي ملاحظات أخرى…"
            className="cw-field__control"
          />
        </FieldShell>
      </div>
    </div>
  );
}
