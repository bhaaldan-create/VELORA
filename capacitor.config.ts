import { config as loadEnv } from "dotenv";
import type { CapacitorConfig } from "@capacitor/cli";

loadEnv({ path: ".env.local" });
loadEnv();

/**
 * تطبيق VELORA للجوال عبر Capacitor.
 * الموقع يبقى على الخادم (Next.js + API + قاعدة البيانات)،
 * والتطبيق غلاف أصلي يفتح نفس التجربة على Android و iOS.
 *
 * التطوير: عيّني VELORA_MOBILE_URL إلى IP جهازك على الشبكة
 *   مثال: http://192.168.1.10:3000
 * الإنتاج: رابط الموقع المنشور
 *   مثال: https://velora.example.com
 */
const serverUrl = (
  process.env.VELORA_MOBILE_URL ||
  process.env.CAPACITOR_SERVER_URL ||
  ""
).trim();

const config: CapacitorConfig = {
  appId: "beauty.velora.app",
  appName: "VELORA",
  webDir: "mobile-www",
  backgroundColor: "#F8F4F1",
  android: {
    allowMixedContent: true,
    backgroundColor: "#F8F4F1",
  },
  ios: {
    backgroundColor: "#F8F4F1",
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#F8F4F1",
      showSpinner: false,
      androidSplashResourceName: "splash",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#F8F4F1",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

if (serverUrl) {
  config.server = {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: "https",
  };
}

export default config;
