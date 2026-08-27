import "dotenv/config";
import { backfillPurchaseLoyalty, backfillReferralCodes } from "../src/lib/loyalty/backfill";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const codes = await backfillReferralCodes(2000);
  console.log("[loyalty] referral codes ensured:", codes);
  const result = await backfillPurchaseLoyalty({ dryRun });
  console.log("[loyalty] purchase backfill:", result);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
