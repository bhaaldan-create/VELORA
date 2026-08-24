"use client";

import "@/app/auth.css";
import { Suspense } from "react";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthWhatsAppButton } from "@/components/auth/AuthWhatsAppButton";
import { BrandHero } from "@/components/auth/BrandHero";
import { useLocale } from "@/context/LocaleContext";

export function AuthLayout({
  children,
  activeTab,
}: {
  children: React.ReactNode;
  activeTab: "login" | "register";
}) {
  const { locale } = useLocale();

  return (
    <div className="auth-page" dir={locale === "en" ? "ltr" : "rtl"}>
      <AuthBackground />
      <AuthHeader />
      <BrandHero locale={locale} />
      <div className="relative z-10 mx-auto w-full max-w-[680px] px-4 pb-6 sm:px-6">
        <div className="auth-card">
          <Suspense fallback={<div className="auth-tabs mb-7 h-10" />}>
            <AuthTabs active={activeTab} locale={locale} />
          </Suspense>
          {children}
        </div>
      </div>
      <AuthFooter locale={locale} />
      <AuthWhatsAppButton />
    </div>
  );
}
