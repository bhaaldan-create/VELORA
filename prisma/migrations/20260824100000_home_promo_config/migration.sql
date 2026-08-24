-- CreateTable
CREATE TABLE IF NOT EXISTS "HomePromoConfig" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomePromoConfig_pkey" PRIMARY KEY ("id")
);
