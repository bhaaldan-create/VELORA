import { getBusinessOverview, type PeriodKey } from "@/lib/finance/overview";
import { getAdminProductRanks } from "@/lib/admin/home-ranks";
import { assertAdminModule } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await assertAdminModule("overview");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "last30") as PeriodKey;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const overview = await getBusinessOverview(period, from, to);
  const ranks = await getAdminProductRanks(overview.salesByProduct);
  return Response.json({ ok: true, ...ranks });
}
