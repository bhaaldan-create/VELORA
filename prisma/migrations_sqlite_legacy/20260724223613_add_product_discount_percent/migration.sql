-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "benefitsJson" TEXT NOT NULL,
    "benefitsArJson" TEXT NOT NULL,
    "ingredientsJson" TEXT NOT NULL,
    "concernsJson" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "isBestseller" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "imageTone" TEXT NOT NULL,
    "imageUrl" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "Category" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("benefitsArJson", "benefitsJson", "categorySlug", "concernsJson", "createdAt", "currency", "description", "descriptionAr", "id", "imageTone", "imageUrl", "ingredientsJson", "isActive", "isBestseller", "isNew", "name", "nameAr", "price", "rating", "reviews", "size", "slug", "stock", "updatedAt") SELECT "benefitsArJson", "benefitsJson", "categorySlug", "concernsJson", "createdAt", "currency", "description", "descriptionAr", "id", "imageTone", "imageUrl", "ingredientsJson", "isActive", "isBestseller", "isNew", "name", "nameAr", "price", "rating", "reviews", "size", "slug", "stock", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categorySlug_idx" ON "Product"("categorySlug");
CREATE INDEX "Product_isActive_isBestseller_idx" ON "Product"("isActive", "isBestseller");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
