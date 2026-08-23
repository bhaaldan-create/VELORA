-- AlterTable
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Employee_username_key" ON "Employee"("username");
CREATE INDEX IF NOT EXISTS "Employee_lastSeenAt_idx" ON "Employee"("lastSeenAt");
