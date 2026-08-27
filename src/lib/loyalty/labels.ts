import { LOYALTY_EVENT, type LoyaltyEventType } from "@/lib/loyalty/config";

const LABELS: Record<
  string,
  { ar: string; en: string }
> = {
  [LOYALTY_EVENT.ACCOUNT_CREATED]: {
    ar: "إنشاء حساب",
    en: "Account created",
  },
  [LOYALTY_EVENT.PROFILE_COMPLETED]: {
    ar: "إكمال الملف الشخصي",
    en: "Profile completed",
  },
  [LOYALTY_EVENT.PURCHASE]: {
    ar: "شراء طلب",
    en: "Order purchase",
  },
  [LOYALTY_EVENT.FIRST_PURCHASE]: {
    ar: "مكافأة أول طلب",
    en: "First purchase bonus",
  },
  [LOYALTY_EVENT.PRODUCT_FAVORITED]: {
    ar: "إضافة منتج للمفضلة",
    en: "Product favorited",
  },
  [LOYALTY_EVENT.REFERRAL_LINK_SHARED]: {
    ar: "مشاركة رابط الدعوة",
    en: "Referral link shared",
  },
  [LOYALTY_EVENT.REFERRAL_SUCCESS_REFERRER]: {
    ar: "دعوة صديق ناجحة",
    en: "Successful referral",
  },
  [LOYALTY_EVENT.REFERRAL_SUCCESS_REFERRED_USER]: {
    ar: "مكافأة انضمام عبر دعوة",
    en: "Welcome referral bonus",
  },
  [LOYALTY_EVENT.VERIFIED_PRODUCT_REVIEW]: {
    ar: "تقييم منتج تم شراؤه",
    en: "Verified product review",
  },
  [LOYALTY_EVENT.QR_REWARD_CLAIMED]: {
    ar: "مسح QR من حملة Velora",
    en: "Velora QR campaign claim",
  },
  [LOYALTY_EVENT.BIRTHDAY_BONUS]: {
    ar: "مكافأة عيد الميلاد",
    en: "Birthday bonus",
  },
  [LOYALTY_EVENT.PURCHASE_REVERSAL]: {
    ar: "استرجاع نقاط طلب",
    en: "Order points reversal",
  },
  [LOYALTY_EVENT.FIRST_PURCHASE_REVERSAL]: {
    ar: "استرجاع مكافأة أول طلب",
    en: "First purchase bonus reversal",
  },
  [LOYALTY_EVENT.REFERRAL_REVERSAL_REFERRER]: {
    ar: "استرجاع نقاط إحالة",
    en: "Referral points reversal",
  },
  [LOYALTY_EVENT.REFERRAL_REVERSAL_REFERRED]: {
    ar: "استرجاع مكافأة الدعوة",
    en: "Referral welcome reversal",
  },
  [LOYALTY_EVENT.MANUAL_ADJUSTMENT]: {
    ar: "تعديل يدوي",
    en: "Manual adjustment",
  },
};

export function loyaltyEventLabel(
  eventType: string | LoyaltyEventType,
  locale: "ar" | "en" = "ar",
): string {
  const row = LABELS[eventType];
  if (!row) return eventType;
  return locale === "ar" ? row.ar : row.en;
}

export function purchaseActivityLabel(orderId: string, locale: "ar" | "en") {
  const short = orderId.slice(-6).toUpperCase();
  return locale === "ar" ? `شراء طلب #${short}` : `Order #${short} purchase`;
}
