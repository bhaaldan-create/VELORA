import { authCopy } from "@/components/auth/auth-copy";
import { passwordStrength } from "@/components/auth/auth-utils";
import type { Locale } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function PasswordStrength({
  password,
  locale,
}: {
  password: string;
  locale: Locale;
}) {
  const copy = authCopy(locale);
  const strength = passwordStrength(password);
  if (!password) return null;

  const label =
    strength <= 1
      ? copy.strengthWeak
      : strength === 2
        ? copy.strengthMedium
        : copy.strengthStrong;

  return (
    <div className="mt-2">
      <div className="auth-strength-bar" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn(
              "auth-strength-segment",
              strength >= n && `is-active-${Math.max(strength, 1)}`,
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-[0.75rem] text-[var(--velora-mauve)]">{label}</p>
    </div>
  );
}
