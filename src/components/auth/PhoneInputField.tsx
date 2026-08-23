import { Phone } from "lucide-react";
import { InputField } from "@/components/auth/InputField";

type PhoneInputProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string | null;
};

export function PhoneInputField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  disabled,
  error,
}: PhoneInputProps) {
  return (
    <InputField
      label={label}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      hint={hint}
      error={error}
      dir="ltr"
      icon={<Phone size={18} aria-hidden />}
    />
  );
}
