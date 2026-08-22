import { NextResponse } from "next/server";
import { recommendFromLarsaProfile } from "@/lib/larsa/recommend";
import { toRecommendationPayload } from "@/lib/advisor/catalog";

export const dynamic = "force-dynamic";

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

    return NextResponse.json({
      ok: true,
      understood: result.understood,
      ritualNote: result.ritualNote,
      ritualSteps: result.ritualSteps,
      products: toRecommendationPayload(result.products),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "تعذّر ترتيب التوصيات" },
      { status: 500 },
    );
  }
}
