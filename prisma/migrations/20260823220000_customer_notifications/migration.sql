-- CreateTable
CREATE TABLE IF NOT EXISTS "NotificationCampaign" (
    "id" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "titleEn" TEXT,
    "bodyEn" TEXT,
    "href" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerNotification" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "campaignId" TEXT,
    "titleAr" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "titleEn" TEXT,
    "bodyEn" TEXT,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NotificationCampaign_createdAt_idx" ON "NotificationCampaign"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerNotification_customerId_createdAt_idx" ON "CustomerNotification"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerNotification_customerId_readAt_idx" ON "CustomerNotification"("customerId", "readAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerNotification_campaignId_idx" ON "CustomerNotification"("campaignId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CustomerNotification" ADD CONSTRAINT "CustomerNotification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CustomerNotification" ADD CONSTRAINT "CustomerNotification_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NotificationCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
