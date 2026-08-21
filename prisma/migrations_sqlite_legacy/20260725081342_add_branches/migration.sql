-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Seed default branches
INSERT INTO "Branch" ("id", "name", "city", "address", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('br_anbar', 'الأنبار', 'الأنبار', '', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('br_baghdad_amiriya', 'بغداد - العامرية', 'بغداد', 'العامرية', 1, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'other',
    "baseSalary" INTEGER NOT NULL DEFAULT 0,
    "hireDate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT NOT NULL DEFAULT '',
    "branchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("baseSalary", "branchId", "createdAt", "hireDate", "id", "isActive", "name", "notes", "phone", "role", "updatedAt")
SELECT "baseSalary", 'br_anbar', "createdAt", "hireDate", "id", "isActive", "name", "notes", "phone", "role", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE INDEX "Employee_isActive_role_idx" ON "Employee"("isActive", "role");
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Branch_isActive_sortOrder_idx" ON "Branch"("isActive", "sortOrder");
