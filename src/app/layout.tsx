import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { IBM_Plex_Sans_Arabic, Outfit } from "next/font/google";
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

/** خط عربي خفيف */
const sans = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: true,
});

/** خط لاتيني مودرن لشعارات مثل My VELORA */
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F4F1" },
    { media: "(prefers-color-scheme: dark)", color: "#141114" },
  ],
};

const themeBootScript = `(function(){try{var t=localStorage.getItem("velora-theme");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");document.documentElement.style.colorScheme="dark";}var l=localStorage.getItem("velora-locale");if(l==="en"){document.documentElement.lang="en";document.documentElement.dir="ltr";document.documentElement.setAttribute("data-locale","en");}else{document.documentElement.lang="ar";document.documentElement.dir="rtl";document.documentElement.setAttribute("data-locale","ar");}}catch(e){}})();`;

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
      className={`${sans.variable} ${latin.variable} h-full`}
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
