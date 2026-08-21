import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

import { defineConfig } from "prisma/config";

/** Prefer process.env so Vercel build env is visible; dotenv fills local only. */
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
