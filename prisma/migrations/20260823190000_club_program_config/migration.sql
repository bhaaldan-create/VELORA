-- CreateTable
CREATE TABLE IF NOT EXISTS "ClubProgramConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubProgramConfig_pkey" PRIMARY KEY ("id")
);
