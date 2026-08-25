import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { IBM_Plex_Sans_Arabic, Outfit } from "next/font/google";
import localFont from "next/font/local";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NativeAppShell } from "@/components/layout/NativeAppShell";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { PrimaryBottomNav } from "@/components/layout/PrimaryBottomNav";
import { SiteMain } from "@/components/layout/SiteMain";
import { Providers } from "@/components/layout/Providers";
import { FloatingContactLazy } from "@/components/contact/FloatingContactLazy";
import { RoutePrefetcher } from "@/components/layout/RoutePrefetcher";
import { brand } from "@/constants/brand";
import "./globals.css";

/** نص الواجهة والأسعار — IBM Plex Sans Arabic */
const sans = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

/**
 * عناوين العرض — Kufyan Arabic
 * Thin 100 · UltraLight 200 · Light 300 · Regular 400 · Bold 700 · Heavy 800 · Black 900
 */
const kufyan = localFont({
  src: [
    {
      path: "../fonts/kufyan/Kufyan_Arabic_Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../fonts/kufyan/Kufyan_Arabic_UltraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/kufyan/Kufyan_Arabic_Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/kufyan/Kufyan_Arabic_Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/kufyan/Kufyan_Arabic_Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/kufyan/Kufyan_Arabic_Heavy.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/kufyan/Kufyan_Arabic_Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-kufyan",
  display: "swap",
  preload: true,
});

/** لاتيني مودرن لشعارات مثل My VELORA */
const latin = Outfit({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: `الصفحة الرئيسية · ${brand.name}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.descriptionAr,
  openGraph: {
    title: `${brand.name} · ${brand.tagline}`,
    description: brand.descriptionAr,
    type: "website",
    locale: "ar_IQ",
  },
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  /* يُحدَّث ديناميكياً عبر ThemeContext ليتوافق مع اختيار المستخدم */
  themeColor: "#F8F4F1",
};

const themeBootScript = `(function(){try{var t=localStorage.getItem("velora-theme");var dark=t==="dark";if(dark){document.documentElement.setAttribute("data-theme","dark");document.documentElement.style.colorScheme="dark";}var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute("content",dark?"#141114":"#F8F4F1");}var l=localStorage.getItem("velora-locale");if(l==="en"){document.documentElement.lang="en";document.documentElement.dir="ltr";document.documentElement.setAttribute("data-locale","en");}else{document.documentElement.lang="ar";document.documentElement.dir="rtl";document.documentElement.setAttribute("data-locale","ar");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${sans.variable} ${kufyan.variable} ${latin.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-full max-w-full flex-col overflow-x-clip antialiased">
        <Providers>
          <RoutePrefetcher />
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <NativeAppShell />
          <Header />
          <SiteMain>{children}</SiteMain>
          <Footer />
          <FloatingContactLazy />
          <Suspense fallback={null}>
            <PrimaryBottomNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
