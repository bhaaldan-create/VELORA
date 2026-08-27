-- AlterTable
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "referredByCustomerId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_referralCode_key" ON "Customer"("referralCode");
CREATE INDEX IF NOT EXISTS "Customer_referredByCustomerId_idx" ON "Customer"("referredByCustomerId");

DO $$ BEGIN
  ALTER TABLE "Customer"
    ADD CONSTRAINT "Customer_referredByCustomerId_fkey"
    FOREIGN KEY ("referredByCustomerId") REFERENCES "Customer"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerLoyaltyBalance" (
    "customerId" TEXT NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeRedeemed" INTEGER NOT NULL DEFAULT 0,
    "pending" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerLoyaltyBalance_pkey" PRIMARY KEY ("customerId")
);

CREATE TABLE IF NOT EXISTS "LoyaltyLedgerEntry" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'posted',
    "referenceId" TEXT NOT NULL,
    "orderId" TEXT,
    "productId" TEXT,
    "qrCampaignId" TEXT,
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "metaJson" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoyaltyLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LoyaltyQrCampaign" (
    "id" TEXT NOT NULL,
    "campaignKey" TEXT NOT NULL,
    "secureToken" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL DEFAULT '',
    "titleEn" TEXT NOT NULL DEFAULT '',
    "points" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxClaims" INTEGER,
    "maxClaimsPerCustomer" INTEGER NOT NULL DEFAULT 1,
    "metaJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoyaltyQrCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LoyaltyQrClaim" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "ledgerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoyaltyQrClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LoyaltyPromoCampaign" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metaJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoyaltyPromoCampaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyLedgerEntry_customerId_eventType_referenceId_key"
  ON "LoyaltyLedgerEntry"("customerId", "eventType", "referenceId");
CREATE INDEX IF NOT EXISTS "LoyaltyLedgerEntry_customerId_createdAt_idx"
  ON "LoyaltyLedgerEntry"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "LoyaltyLedgerEntry_eventType_createdAt_idx"
  ON "LoyaltyLedgerEntry"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "LoyaltyLedgerEntry_orderId_idx"
  ON "LoyaltyLedgerEntry"("orderId");
CREATE INDEX IF NOT EXISTS "LoyaltyLedgerEntry_qrCampaignId_idx"
  ON "LoyaltyLedgerEntry"("qrCampaignId");

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyQrCampaign_campaignKey_key" ON "LoyaltyQrCampaign"("campaignKey");
CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyQrCampaign_secureToken_key" ON "LoyaltyQrCampaign"("secureToken");
CREATE INDEX IF NOT EXISTS "LoyaltyQrCampaign_active_startsAt_endsAt_idx"
  ON "LoyaltyQrCampaign"("active", "startsAt", "endsAt");

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyQrClaim_campaignId_customerId_key"
  ON "LoyaltyQrClaim"("campaignId", "customerId");
CREATE INDEX IF NOT EXISTS "LoyaltyQrClaim_customerId_createdAt_idx"
  ON "LoyaltyQrClaim"("customerId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyPromoCampaign_campaignId_key" ON "LoyaltyPromoCampaign"("campaignId");
CREATE INDEX IF NOT EXISTS "LoyaltyPromoCampaign_active_type_startsAt_endsAt_idx"
  ON "LoyaltyPromoCampaign"("active", "type", "startsAt", "endsAt");

DO $$ BEGIN
  ALTER TABLE "CustomerLoyaltyBalance"
    ADD CONSTRAINT "CustomerLoyaltyBalance_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LoyaltyLedgerEntry"
    ADD CONSTRAINT "LoyaltyLedgerEntry_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LoyaltyQrClaim"
    ADD CONSTRAINT "LoyaltyQrClaim_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "LoyaltyQrCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LoyaltyQrClaim"
    ADD CONSTRAINT "LoyaltyQrClaim_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
