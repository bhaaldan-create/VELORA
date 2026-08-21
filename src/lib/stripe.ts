import Stripe from "stripe";
import {
  USD_TO_IQD_RATE,
  isCardPaymentMethod,
} from "@/lib/stripe-public";

export { USD_TO_IQD_RATE, isCardPaymentMethod };

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
  );
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
}

let stripeSingleton: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY غير مضبوط في .env.local");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

/** تحويل مبلغ IQD إلى سنتات USD لـ Stripe */
export function iqdToUsdCents(iqd: number) {
  const usd = iqd / USD_TO_IQD_RATE;
  return Math.max(50, Math.round(usd * 100)); // حد أدنى 0.50$
}

export function usdCentsToIqd(cents: number) {
  return Math.round((cents / 100) * USD_TO_IQD_RATE);
}
