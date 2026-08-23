-- CreateTable
CREATE TABLE IF NOT EXISTS "HomeHeroConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeHeroConfig_pkey" PRIMARY KEY ("id")
);
