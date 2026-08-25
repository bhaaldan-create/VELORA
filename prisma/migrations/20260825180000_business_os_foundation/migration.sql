-- VELORA Business OS foundation

-- Product cost fields
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "costCurrency" TEXT NOT NULL DEFAULT 'IQD';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "costExchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shippingCostIqd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "customsCostIqd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brokerageCostIqd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "handlingCostIqd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "otherCostIqd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "landedCostIqd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "minMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 20;

CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "catalogUrl" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "whatsappUrl" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "alibabaUrl" TEXT NOT NULL DEFAULT '',
    "otherLinksJson" JSONB NOT NULL DEFAULT '[]',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTerms" TEXT NOT NULL DEFAULT '',
    "shippingMethod" TEXT NOT NULL DEFAULT '',
    "reliabilityRating" INTEGER NOT NULL DEFAULT 3,
    "avgDeliveryDays" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BrandProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "countryOfOrigin" TEXT NOT NULL DEFAULT '',
    "officialWebsite" TEXT NOT NULL DEFAULT '',
    "supplierId" TEXT,
    "sourceCountry" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT NOT NULL DEFAULT '',
    "documentsJson" JSONB NOT NULL DEFAULT '[]',
    "linksJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ImportShipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "supplierId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Planned',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "purchaseDate" TEXT NOT NULL DEFAULT '',
    "shippingDate" TEXT NOT NULL DEFAULT '',
    "arrivalDate" TEXT NOT NULL DEFAULT '',
    "receivedDate" TEXT NOT NULL DEFAULT '',
    "trackingNumber" TEXT NOT NULL DEFAULT '',
    "purchaseTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "brokerageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLandedIqd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "documentsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportShipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ImportItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "landedUnitIqd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InventoryMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reference" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "actorId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "amountIqd" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "recurrence" TEXT NOT NULL DEFAULT 'one_time',
    "vendor" TEXT NOT NULL DEFAULT '',
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "attachmentUrl" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL DEFAULT 'root',
    "actorLabel" TEXT NOT NULL DEFAULT 'root',
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL DEFAULT '',
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiInsight" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "whyAr" TEXT NOT NULL DEFAULT '',
    "whyEn" TEXT NOT NULL DEFAULT '',
    "evidenceJson" JSONB NOT NULL DEFAULT '{}',
    "entityType" TEXT NOT NULL DEFAULT '',
    "entityId" TEXT NOT NULL DEFAULT '',
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BrandProfile_slug_key" ON "BrandProfile"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "ImportShipment_code_key" ON "ImportShipment"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseCategory_slug_key" ON "ExpenseCategory"("slug");

CREATE INDEX IF NOT EXISTS "Product_supplierId_idx" ON "Product"("supplierId");
CREATE INDEX IF NOT EXISTS "Product_brandName_idx" ON "Product"("brandName");
CREATE INDEX IF NOT EXISTS "Supplier_isActive_name_idx" ON "Supplier"("isActive", "name");
CREATE INDEX IF NOT EXISTS "BrandProfile_supplierId_idx" ON "BrandProfile"("supplierId");
CREATE INDEX IF NOT EXISTS "BrandProfile_name_idx" ON "BrandProfile"("name");
CREATE INDEX IF NOT EXISTS "ImportShipment_status_createdAt_idx" ON "ImportShipment"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ImportShipment_supplierId_idx" ON "ImportShipment"("supplierId");
CREATE INDEX IF NOT EXISTS "ImportItem_shipmentId_idx" ON "ImportItem"("shipmentId");
CREATE INDEX IF NOT EXISTS "ImportItem_productId_idx" ON "ImportItem"("productId");
CREATE INDEX IF NOT EXISTS "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryMovement_type_createdAt_idx" ON "InventoryMovement"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "Expense_date_idx" ON "Expense"("date");
CREATE INDEX IF NOT EXISTS "Expense_categoryId_idx" ON "Expense"("categoryId");
CREATE INDEX IF NOT EXISTS "Expense_recurrence_idx" ON "Expense"("recurrence");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AiInsight_severity_createdAt_idx" ON "AiInsight"("severity", "createdAt");
CREATE INDEX IF NOT EXISTS "AiInsight_kind_createdAt_idx" ON "AiInsight"("kind", "createdAt");
CREATE INDEX IF NOT EXISTS "AiInsight_dismissedAt_idx" ON "AiInsight"("dismissedAt");

DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ImportShipment" ADD CONSTRAINT "ImportShipment_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_shipmentId_fkey"
    FOREIGN KEY ("shipmentId") REFERENCES "ImportShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed default expense categories
INSERT INTO "ExpenseCategory" ("id", "nameAr", "nameEn", "slug", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  ('expcat_rent', 'إيجار', 'Rent', 'rent', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_salaries', 'رواتب', 'Salaries', 'salaries', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_marketing', 'تسويق', 'Marketing', 'marketing', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_ads', 'إعلانات', 'Advertising', 'advertising', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_shipping', 'شحن', 'Shipping', 'shipping', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_packaging', 'تغليف', 'Packaging', 'packaging', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_utilities', 'مرافق', 'Utilities', 'utilities', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_software', 'برمجيات', 'Software', 'software', 8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_subs', 'اشتراكات', 'Subscriptions', 'subscriptions', 9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_maint', 'صيانة', 'Maintenance', 'maintenance', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_import', 'مصاريف استيراد', 'Import expenses', 'import-expenses', 11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_fees', 'رسوم بنكية/دفع', 'Banking/payment fees', 'banking-fees', 12, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('expcat_other', 'أخرى', 'Other', 'other', 99, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
