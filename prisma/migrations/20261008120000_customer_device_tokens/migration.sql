-- Push device tokens for real phone notifications (FCM)
CREATE TABLE IF NOT EXISTS "CustomerDeviceToken" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerDeviceToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerDeviceToken_token_key" ON "CustomerDeviceToken"("token");
CREATE INDEX IF NOT EXISTS "CustomerDeviceToken_customerId_updatedAt_idx" ON "CustomerDeviceToken"("customerId", "updatedAt");
CREATE INDEX IF NOT EXISTS "CustomerDeviceToken_platform_idx" ON "CustomerDeviceToken"("platform");

DO $$ BEGIN
  ALTER TABLE "CustomerDeviceToken"
    ADD CONSTRAINT "CustomerDeviceToken_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
