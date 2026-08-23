export type ClubTierId = "muse" | "glow" | "signature" | "prive";

export type ClubRewardCta = "redeem" | "reveal" | "unlock";

export type ClubTier = {
  id: ClubTierId;
  nameEn: string;
  nameAr: string;
  minPoints: number;
  maxPoints: number | null;
  icon: ClubTierId;
  privilegesEn: string[];
  privilegesAr: string[];
  birthdayGiftEn: string;
  birthdayGiftAr: string;
};

export type ClubReward = {
  id: string;
  cost: number;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  cta: ClubRewardCta;
};

export type ClubPassportBrand = {
  id: string;
  name: string;
};

export type ClubMysteryReward = {
  id: string;
  titleEn: string;
  titleAr: string;
};

export type ClubPrivilegeCard = {
  id: string;
  icon: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
};

export type ClubEarnCard = {
  id: string;
  icon: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
};

export type ClubConfig = {
  version: number;
  iqdPerPoint: number;
  reviewBonus: number;
  referralBonus: number;
  birthdayBonus: number;
  doublePointsActive: boolean;
  triplePointsActive: boolean;
  streakMonthsRequired: number;
  passportRewardPoints: number;
  tiers: ClubTier[];
  rewards: ClubReward[];
  privileges: ClubPrivilegeCard[];
  earnCards: ClubEarnCard[];
  passportBrands: ClubPassportBrand[];
  mysteryPool: ClubMysteryReward[];
  priveBenefitsEn: string[];
  priveBenefitsAr: string[];
  conciergeWhatsApp: string;
};

export type ClubActivityItem = {
  id: string;
  delta: number;
  labelEn: string;
  labelAr: string;
  at: string;
};

export type ClubMemberState = {
  customerId: string;
  fullName: string;
  memberId: string;
  referralCode: string;
  points: number;
  tierId: ClubTierId;
  nextTierId: ClubTierId | null;
  pointsToNext: number;
  progressRatio: number;
  earnedThisMonth: number;
  fromReviews: number;
  fromReferrals: number;
  referralCount: number;
  streakMonths: number;
  passportUnlocked: string[];
  activity: ClubActivityItem[];
  nextPrivilegeEn: string;
  nextPrivilegeAr: string;
};
