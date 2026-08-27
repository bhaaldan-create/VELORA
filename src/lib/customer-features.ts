/**
 * Temporary customer-facing visibility flags.
 * Flip a flag to `true` when ready to show again.
 * Backend systems (points earning, admin tools) keep running regardless.
 */
export const customerFeatures = {
  /** VELORA Beauty Club storefront (/account/club) */
  club: false,
  /** MY VELORA hub, cards, passport, public share pages */
  myVelora: false,
  /** Coupons UI on account overview */
  coupons: false,
} as const;

export type CustomerFeature = keyof typeof customerFeatures;

export function isCustomerFeatureEnabled(feature: CustomerFeature): boolean {
  return customerFeatures[feature];
}
