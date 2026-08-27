/**
 * Temporary customer-facing visibility flags.
 * Flip a flag to `true` when ready to show again.
 * Backend systems (points earning, admin tools) keep running regardless.
 */
export const customerFeatures = {
  /** VELORA Beauty Club storefront (/account/club) */
  club: false,
  /** MY VELORA hub + order cards (not passport) */
  myVelora: false,
  /** MY VELORA Passport — stays visible */
  passport: true,
  /** Coupons UI on account overview */
  coupons: false,
} as const;

export type CustomerFeature = keyof typeof customerFeatures;

export function isCustomerFeatureEnabled(feature: CustomerFeature): boolean {
  return customerFeatures[feature];
}
