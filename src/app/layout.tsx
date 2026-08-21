import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NativeAppShell } from "@/components/layout/NativeAppShell";
import { PrimaryBottomNav } from "@/components/layout/PrimaryBottomNav";
import { Providers } from "@/components/layout/Providers";
import { brand } from "@/constants/brand";
import "./globals.css";

/** خط عربي/لاتيني حديث موحّد للواجهة */
const body = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

/** نفس العائلة للعناوين — أوزان أثقل عبر CSS */
const display = IBM_Plex_Sans_Arabic({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
});

/** خط فاخر راقٍ لاسم VELORA */
const brandFont = Bodoni_Moda({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F4F1" },
    { media: "(prefers-color-scheme: dark)", color: "#141114" },
  ],
};

const themeBootScript = `(function(){try{var t=localStorage.getItem("velora-theme");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`;

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
      className={`${body.variable} ${display.variable} ${brandFont.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          <NativeAppShell />
          <Header />
          <main className="flex-1 pb-20 lg:pb-0">{children}</main>
          <Footer />
          <PrimaryBottomNav />
        </Providers>
      </body>
    </html>
  );
}
