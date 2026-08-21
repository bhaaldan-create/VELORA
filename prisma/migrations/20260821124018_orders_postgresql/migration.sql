-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "emailedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "orderJson" JSONB NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "adminNote" TEXT,
    "receiptSentAt" TIMESTAMP(3),
    "savedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_status_savedAt_idx" ON "Order"("status", "savedAt");

-- CreateIndex
CREATE INDEX "Order_savedAt_idx" ON "Order"("savedAt");
