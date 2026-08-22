import { toWhatsAppPhone } from "@/lib/whatsapp-receipt";
import { formatPrice } from "@/lib/utils";
import { getProductBrand } from "@/lib/product-brand";

/**
 * مصدر واحد لروابط التواصل الاجتماعي في واجهة المتجر.
 * رقم واتساب: NEXT_PUBLIC_WHATSAPP_COMPANY_PHONE أو الرقم المعتمد في المشروع.
 * (لوحة /admin/whatsapp تستخدم نفس الرقم الافتراضي لإرسال OTP.)
 */
export const socialLinks = {
  instagram: {
    handle: "@velorabeautyiraq",
    username: "velorabeautyiraq",
    url: "https://www.instagram.com/velorabeautyiraq/",
  },
  whatsapp: {
    /** 07830000492 — من إعدادات المشروع؛ يمكن تجاوزه عبر env */
    phoneLocal:
      (typeof process !== "undefined" &&
        process.env.NEXT_PUBLIC_WHATSAPP_COMPANY_PHONE?.trim()) ||
      "07830000492",
    defaultMessage: {
      ar: "مرحباً VELORA BEAUTY 🤍\nأرغب بالاستفسار عن أحد منتجاتكم / إجراء طلب.",
      en: "Hello VELORA BEAUTY 🤍\nI’d like to ask about a product / place an order.",
    },
  },
} as const;

export function getWhatsAppPhoneDigits() {
  return toWhatsAppPhone(socialLinks.whatsapp.phoneLocal);
}

/** رابط واتساب مع رسالة جاهزة (URL-encoded) */
export function buildCompanyWhatsAppUrl(message: string) {
  const phone = getWhatsAppPhoneDigits();
  if (!phone) return null;
  const text = message.trim();
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${phone}${q}`;
}

export function getDefaultWhatsAppUrl(locale: "ar" | "en" = "ar") {
  return buildCompanyWhatsAppUrl(
    socialLinks.whatsapp.defaultMessage[locale] ??
      socialLinks.whatsapp.defaultMessage.ar,
  );
}

export function getInstagramUrl() {
  return socialLinks.instagram.url;
}

export type SocialProductSnippet = {
  name: string;
  nameAr: string;
  price: number;
};

/** رسالة طلب منتج ديناميكية من بيانات المنتج الفعلية */
export function buildProductWhatsAppMessage(
  product: SocialProductSnippet,
  locale: "ar" | "en" = "ar",
) {
  const brandName = getProductBrand(product.name, product.nameAr);
  const title = locale === "en" ? product.name : product.nameAr;
  const price = formatPrice(product.price);

  if (locale === "en") {
    return [
      "Hello VELORA BEAUTY 🤍",
      "I’d like to order this product:",
      "",
      title,
      brandName,
      price,
      "",
      "Is this product available?",
    ].join("\n");
  }

  return [
    "مرحباً VELORA BEAUTY 🤍",
    "أرغب بطلب هذا المنتج:",
    "",
    title,
    brandName,
    price,
    "",
    "هل المنتج متوفر؟",
  ].join("\n");
}

export function getProductWhatsAppUrl(
  product: SocialProductSnippet,
  locale: "ar" | "en" = "ar",
) {
  return buildCompanyWhatsAppUrl(buildProductWhatsAppMessage(product, locale));
}
