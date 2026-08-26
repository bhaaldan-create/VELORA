-- MY VELORA PASSPORT foundation (additive, nullable — no data loss)

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "passportNumber" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "passportToken" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "governorate" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "passportOpenedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_passportNumber_key" ON "Customer"("passportNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_passportToken_key" ON "Customer"("passportToken");

CREATE TABLE IF NOT EXISTS "VeloraPassportConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VeloraPassportConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VeloraBeautyProfile" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "skinType" TEXT NOT NULL DEFAULT '',
    "skinConcernsJson" JSONB NOT NULL DEFAULT '[]',
    "beautyGoalsJson" JSONB NOT NULL DEFAULT '[]',
    "makeupStyle" TEXT NOT NULL DEFAULT '',
    "preferredFinish" TEXT NOT NULL DEFAULT '',
    "favoriteCategoriesJson" JSONB NOT NULL DEFAULT '[]',
    "preferredBrandsJson" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VeloraBeautyProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VeloraBeautyProfile_customerId_key" ON "VeloraBeautyProfile"("customerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VeloraBeautyProfile_customerId_fkey'
  ) THEN
    ALTER TABLE "VeloraBeautyProfile"
      ADD CONSTRAINT "VeloraBeautyProfile_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
