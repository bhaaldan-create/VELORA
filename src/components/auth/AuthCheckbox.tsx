import { Check } from "lucide-react";

type AuthCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
};

export function AuthCheckbox({
  checked,
  onChange,
  label,
  disabled,
  id = "auth-checkbox",
}: AuthCheckboxProps) {
  return (
    <label className="auth-checkbox" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="auth-checkbox-box" aria-hidden>
        <Check size={12} color="#fff" strokeWidth={3} />
      </span>
      <span className="text-[0.875rem] text-[var(--velora-plum)]">{label}</span>
    </label>
  );
}
