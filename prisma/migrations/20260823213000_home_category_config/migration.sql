-- CreateTable
CREATE TABLE IF NOT EXISTS "HomeCategoryConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeCategoryConfig_pkey" PRIMARY KEY ("id")
);
