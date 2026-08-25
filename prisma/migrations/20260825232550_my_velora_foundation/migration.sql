-- AlterTable
ALTER TABLE "BrandProfile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExpenseCategory" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "HomePromoConfig" ALTER COLUMN "id" SET DEFAULT 'default';

-- AlterTable
ALTER TABLE "ImportItem" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ImportShipment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "updatedAt" DROP DEFAULT;
