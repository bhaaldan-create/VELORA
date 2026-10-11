-- Discount engine: campaigns, influencers, coupons, immutable redemptions.
-- Existing orders are untouched. Historical rows are reversed, not deleted.

CREATE TABLE IF NOT EXISTS "PromoCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "budgetIqd" INTEGER,
    "ownerLabel" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Influencer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "platform" TEXT NOT NULL DEFAULT '',
    "username" TEXT NOT NULL DEFAULT '',
    "profileUrl" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "agreementStart" TIMESTAMP(3),
    "agreementEnd" TIMESTAMP(3),
    "commissionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "commissionType" TEXT NOT NULL DEFAULT 'PERCENT',
    "commissionValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "maxDiscountIqd" INTEGER,
    "minSubtotalIqd" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "maxRedemptions" INTEGER,
    "maxPerCustomer" INTEGER,
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "registeredOnly" BOOLEAN NOT NULL DEFAULT false,
    "applyToSaleItems" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "ignoreCampaignPause" BOOLEAN NOT NULL DEFAULT false,
    "minMarginPercent" INTEGER,
    "campaignId" TEXT,
    "influencerId" TEXT,
    "eligibleProductIds" JSONB NOT NULL DEFAULT '[]',
    "eligibleCategories" JSONB NOT NULL DEFAULT '[]',
    "eligibleBrands" JSONB NOT NULL DEFAULT '[]',
    "excludedProductIds" JSONB NOT NULL DEFAULT '[]',
    "excludedCategories" JSONB NOT NULL DEFAULT '[]',
    "excludedBrands" JSONB NOT NULL DEFAULT '[]',
    "restrictedCustomerIds" JSONB NOT NULL DEFAULT '[]',
    "commissionOverrideType" TEXT,
    "commissionOverrideValue" INTEGER,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "updatedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerKey" TEXT NOT NULL,
    "customerId" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL,
    "merchandiseBeforeIqd" INTEGER NOT NULL,
    "discountIqd" INTEGER NOT NULL,
    "shippingDiscountIqd" INTEGER NOT NULL DEFAULT 0,
    "eligibleBaseIqd" INTEGER NOT NULL,
    "deliveryFeeIqd" INTEGER NOT NULL,
    "payableIqd" INTEGER NOT NULL,
    "influencerId" TEXT,
    "campaignId" TEXT,
    "commissionIqd" INTEGER NOT NULL DEFAULT 0,
    "commissionBasisIqd" INTEGER NOT NULL DEFAULT 0,
    "commissionStatus" TEXT NOT NULL DEFAULT 'NONE',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "reviewReasons" JSONB NOT NULL DEFAULT '[]',
    "payoutReference" TEXT NOT NULL DEFAULT '',
    "paidAt" TIMESTAMP(3),
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedReason" TEXT NOT NULL DEFAULT '',
    "snapshotJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CouponAttempt" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL DEFAULT '',
    "codeHash" TEXT NOT NULL DEFAULT '',
    "outcome" TEXT NOT NULL,
    "customerKey" TEXT NOT NULL DEFAULT '',
    "ipHash" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "CouponRedemption_orderId_key" ON "CouponRedemption"("orderId");
CREATE INDEX IF NOT EXISTS "PromoCampaign_status_startsAt_endsAt_idx" ON "PromoCampaign"("status", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "Influencer_status_idx" ON "Influencer"("status");
CREATE INDEX IF NOT EXISTS "Coupon_status_endsAt_idx" ON "Coupon"("status", "endsAt");
CREATE INDEX IF NOT EXISTS "Coupon_campaignId_idx" ON "Coupon"("campaignId");
CREATE INDEX IF NOT EXISTS "Coupon_influencerId_idx" ON "Coupon"("influencerId");
CREATE INDEX IF NOT EXISTS "CouponRedemption_couponId_customerKey_idx" ON "CouponRedemption"("couponId", "customerKey");
CREATE INDEX IF NOT EXISTS "CouponRedemption_influencerId_createdAt_idx" ON "CouponRedemption"("influencerId", "createdAt");
CREATE INDEX IF NOT EXISTS "CouponRedemption_campaignId_createdAt_idx" ON "CouponRedemption"("campaignId", "createdAt");
CREATE INDEX IF NOT EXISTS "CouponRedemption_commissionStatus_reversed_idx" ON "CouponRedemption"("commissionStatus", "reversed");
CREATE INDEX IF NOT EXISTS "CouponAttempt_ipHash_createdAt_idx" ON "CouponAttempt"("ipHash", "createdAt");
CREATE INDEX IF NOT EXISTS "CouponAttempt_createdAt_idx" ON "CouponAttempt"("createdAt");

DO $$ BEGIN
  ALTER TABLE "Coupon"
    ADD CONSTRAINT "Coupon_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "PromoCampaign"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Coupon"
    ADD CONSTRAINT "Coupon_influencerId_fkey"
    FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CouponRedemption"
    ADD CONSTRAINT "CouponRedemption_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "Coupon"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CouponRedemption"
    ADD CONSTRAINT "CouponRedemption_influencerId_fkey"
    FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
