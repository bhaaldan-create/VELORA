import { NextResponse } from "next/server";
import { recommendFromLarsaProfile } from "@/lib/larsa/recommend";
import { enrichLarsaRecommendations } from "@/lib/larsa/insight";
import { toRecommendationPayload } from "@/lib/advisor/catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      pathId?: string;
      categoryHint?: string;
      budget?: string;
      tags?: string[];
      freeText?: string;
    };

    const result = await recommendFromLarsaProfile({
      pathId: body.pathId ?? "unsure",
      categoryHint: body.categoryHint ?? "all",
      budget: body.budget ?? "any",
      tags: body.tags ?? [],
      freeText: body.freeText,
    });

    const insight = await enrichLarsaRecommendations(
      {
        pathId: body.pathId ?? "unsure",
        categoryHint: body.categoryHint ?? "all",
        budget: body.budget ?? "any",
        tags: body.tags ?? [],
        freeText: body.freeText,
      },
      result.products,
      {
        ritualSteps: result.ritualSteps,
        ritualNote: result.ritualNote,
      },
    );

    const insightMap = new Map(
      (insight?.productInsights ?? []).map((pi) => [pi.productId, pi.whyAr]),
    );

    const products = toRecommendationPayload(result.products).map((p) => ({
      ...p,
      whyAr: insightMap.get(p.id) ?? null,
    }));

    return NextResponse.json({
      ok: true,
      aiEnriched: !!insight,
      introLine: insight?.introLine ?? null,
      understood: result.understood,
      ritualNote: insight?.ritualNote ?? result.ritualNote,
      ritualSteps: insight?.ritualSteps ?? result.ritualSteps,
      products,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "تعذّر ترتيب التوصيات" },
      { status: 500 },
    );
  }
}
