-- OAuth: Google / Apple — optional password & phone
ALTER TABLE "Customer" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "appleId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "authProvider" TEXT NOT NULL DEFAULT 'password';

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_googleId_key" ON "Customer"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_appleId_key" ON "Customer"("appleId");
