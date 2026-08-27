/**
 * Central Velora Beauty loyalty earning configuration.
 * Keep all point amounts here — never hardcode in UI or route handlers.
 */
export const LOYALTY_CONFIG = {
  purchase: {
    iqdPerPoint: 5000,
  },

  signup: {
    points: 2,
    maxLifetime: 1,
  },

  profileCompletion: {
    points: 2,
    maxLifetime: 1,
  },

  firstPurchase: {
    points: 5,
    maxLifetime: 1,
  },

  favorite: {
    points: 1,
    dailyLimit: 2,
    monthlyLimit: 10,
  },

  shareReferral: {
    points: 1,
    dailyLimit: 1,
    monthlyLimit: 5,
  },

  successfulReferral: {
    referrerPoints: 10,
    referredCustomerPoints: 5,
  },

  review: {
    points: 2,
    monthlyLimit: 10,
  },

  birthday: {
    points: 5,
    enabled: false,
    maxPerYear: 1,
  },
} as const;

export type LoyaltyConfig = typeof LOYALTY_CONFIG;

export const LOYALTY_EVENT = {
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  PROFILE_COMPLETED: "PROFILE_COMPLETED",
  PURCHASE: "PURCHASE",
  FIRST_PURCHASE: "FIRST_PURCHASE",
  PRODUCT_FAVORITED: "PRODUCT_FAVORITED",
  REFERRAL_LINK_SHARED: "REFERRAL_LINK_SHARED",
  REFERRAL_SUCCESS_REFERRER: "REFERRAL_SUCCESS_REFERRER",
  REFERRAL_SUCCESS_REFERRED_USER: "REFERRAL_SUCCESS_REFERRED_USER",
  VERIFIED_PRODUCT_REVIEW: "VERIFIED_PRODUCT_REVIEW",
  QR_REWARD_CLAIMED: "QR_REWARD_CLAIMED",
  BIRTHDAY_BONUS: "BIRTHDAY_BONUS",
  PURCHASE_REVERSAL: "PURCHASE_REVERSAL",
  FIRST_PURCHASE_REVERSAL: "FIRST_PURCHASE_REVERSAL",
  REFERRAL_REVERSAL_REFERRER: "REFERRAL_REVERSAL_REFERRER",
  REFERRAL_REVERSAL_REFERRED: "REFERRAL_REVERSAL_REFERRED",
  MANUAL_ADJUSTMENT: "MANUAL_ADJUSTMENT",
} as const;

export type LoyaltyEventType =
  (typeof LOYALTY_EVENT)[keyof typeof LOYALTY_EVENT];

export const LOYALTY_DIRECTION = {
  EARN: "EARN",
  REDEEM: "REDEEM",
  REVERSAL: "REVERSAL",
  ADJUSTMENT: "ADJUSTMENT",
} as const;

export type LoyaltyDirection =
  (typeof LOYALTY_DIRECTION)[keyof typeof LOYALTY_DIRECTION];

export const REFERRAL_COOKIE = "velora_ref";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
