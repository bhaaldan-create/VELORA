"use client";

import { getDefaultWhatsAppUrl } from "@/lib/social-links";
import { useLocale } from "@/context/LocaleContext";
import { IconWhatsApp } from "@/components/contact/SocialIcons";

export function AuthWhatsAppButton() {
  const { locale } = useLocale();
  const url = getDefaultWhatsAppUrl(locale === "en" ? "en" : "ar");
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="auth-wa-float"
      aria-label={locale === "en" ? "Contact VELORA on WhatsApp" : "تواصلي مع VELORA عبر WhatsApp"}
    >
      <IconWhatsApp size={22} />
    </a>
  );
}
