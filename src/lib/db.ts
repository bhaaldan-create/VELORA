import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** زد هذا الرقم بعد أي تغيير في schema حتى لا يبقى عميل Prisma قديماً في وضع التطوير */
const PRISMA_SCHEMA_VERSION = 15;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion?: number;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL غير مضبوط. عيّني رابط PostgreSQL في .env.local (انظر .env.example).",
    );
  }
  if (url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL يشير إلى SQLite. استخدم رابط PostgreSQL مثل postgresql://USER:PASS@HOST:5432/DB",
    );
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

function isStalePrismaClient(client: PrismaClient | undefined) {
  if (!client) return true;
  if (globalForPrisma.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION) return true;
  const customer = (
    client as { customer?: { findUnique?: unknown } }
  ).customer;
  const phoneOtp = (
    client as { phoneOtp?: { findFirst?: unknown } }
  ).phoneOtp;
  const homeHero = (
    client as { homeHeroConfig?: { findUnique?: unknown } }
  ).homeHeroConfig;
  const homeCategories = (
    client as { homeCategoryConfig?: { findUnique?: unknown } }
  ).homeCategoryConfig;
  const homePromo = (
    client as { homePromoConfig?: { findUnique?: unknown } }
  ).homePromoConfig;
  const notifications = (
    client as { customerNotification?: { findMany?: unknown } }
  ).customerNotification;
  return (
    typeof customer?.findUnique !== "function" ||
    typeof phoneOtp?.findFirst !== "function" ||
    typeof homeHero?.findUnique !== "function" ||
    typeof homeCategories?.findUnique !== "function" ||
    typeof homePromo?.findUnique !== "function" ||
    typeof notifications?.findMany !== "function"
  );
}

if (
  process.env.NODE_ENV !== "production" &&
  isStalePrismaClient(globalForPrisma.prisma)
) {
  void globalForPrisma.prisma?.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}
