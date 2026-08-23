import { authCopy } from "@/components/auth/auth-copy";
import type { Locale } from "@/i18n/dictionaries";

export function AuthFooter({ locale }: { locale: Locale }) {
  const copy = authCopy(locale);
  return (
    <footer className="relative z-10 px-5 py-8 text-center sm:px-8">
      <p className="text-[0.8125rem] leading-relaxed text-[var(--velora-mauve)]">
        {copy.footer}
      </p>
    </footer>
  );
}
