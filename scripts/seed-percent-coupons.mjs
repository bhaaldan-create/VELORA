import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";

function loadEnv(file, override) {
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] == null) process.env[key] = value;
  }
}

loadEnv(".env", false);
loadEnv(".env.local", true);

const coupons = [
  { code: "SSD56", percent: 8 },
  { code: "KTR28", percent: 10 },
  { code: "HLM41", percent: 15 },
  { code: "QWP73", percent: 20 },
  { code: "BNX19", percent: 25 },
  { code: "FVD64", percent: 30 },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  for (const coupon of coupons) {
    await client.query(
      `
      INSERT INTO "Coupon" (
        "id", "code", "name", "description", "notes", "type", "value",
        "minSubtotalIqd", "status", "applyToSaleItems", "visibility",
        "ignoreCampaignPause",
        "eligibleProductIds", "eligibleCategories", "eligibleBrands",
        "excludedProductIds", "excludedCategories", "excludedBrands",
        "restrictedCustomerIds",
        "createdBy", "updatedBy", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, '', 'كود عام بالنسبة المطلوبة', 'PERCENT', $4,
        0, 'ACTIVE', true, 'PUBLIC',
        false,
        '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
        '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
        '[]'::jsonb,
        'system', 'system', NOW(), NOW()
      )
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "type" = 'PERCENT',
        "value" = EXCLUDED."value",
        "status" = 'ACTIVE',
        "startsAt" = NULL,
        "endsAt" = NULL,
        "maxRedemptions" = NULL,
        "maxPerCustomer" = NULL,
        "applyToSaleItems" = true,
        "updatedBy" = 'system',
        "updatedAt" = NOW()
      `,
      [
        randomUUID(),
        coupon.code,
        `خصم ${coupon.percent}%`,
        coupon.percent,
      ],
    );
  }

  const saved = await client.query(
    `SELECT "code", "value", "status", "type" FROM "Coupon" WHERE "code" = ANY($1::text[]) ORDER BY "value"`,
    [coupons.map((coupon) => coupon.code)],
  );
  console.log(JSON.stringify(saved.rows));
} finally {
  await client.end();
}
