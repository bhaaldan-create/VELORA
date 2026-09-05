import { NextResponse } from "next/server";
import { recommendFromLarsaProfile } from "@/lib/larsa/recommend";
import { enrichLarsaRecommendations } from "@/lib/larsa/insight";
import { selectProductsWithLarsaAgent } from "@/lib/advisor/agent";
import { toRecommendationPayload } from "@/lib/advisor/catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function buildProfileText(body: {
  pathId: string;
  categoryHint: string;
  budget: string;
  tags: string[];
  freeText?: string;
}) {
  return `ملف الاستشارة الموجّهة:
- المسار: ${body.pathId}
- القسم المفضّل: ${body.categoryHint}
- الميزانية: ${body.budget}
- الوسوم/الاحتياجات: ${body.tags.join("، ") || "—"}
- ملاحظات إضافية من العميلة: ${body.freeText?.trim() || "—"}

اختاري 2–4 منتجات متناسقة لروتين عملي يناسب مناخ العراق.`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      pathId?: string;
      categoryHint?: string;
      budget?: string;
      tags?: string[];
      freeText?: string;
    };

    const profile = {
      pathId: body.pathId ?? "unsure",
      categoryHint: body.categoryHint ?? "all",
      budget: body.budget ?? "any",
      tags: body.tags ?? [],
      freeText: body.freeText,
    };

    // Prefer tool-grounded agent selection; heuristics as fallback.
    const agentPick = await selectProductsWithLarsaAgent(
      buildProfileText(profile),
    );

    if (agentPick?.products.length) {
      const insight = await enrichLarsaRecommendations(
        profile,
        agentPick.products,
        {
          ritualSteps: agentPick.ritualSteps,
          ritualNote: agentPick.ritualNote,
        },
      );
      const insightMap = new Map(
        (insight?.productInsights ?? []).map((pi) => [pi.productId, pi.whyAr]),
      );
      const products = toRecommendationPayload(agentPick.products).map((p) => ({
        ...p,
        whyAr: insightMap.get(p.id) ?? null,
      }));

      return NextResponse.json({
        ok: true,
        aiSelected: true,
        aiEnriched: !!insight,
        introLine: insight?.introLine ?? agentPick.introLine,
        understood: profile.tags.slice(0, 8),
        ritualNote: insight?.ritualNote ?? agentPick.ritualNote,
        ritualSteps: insight?.ritualSteps ?? agentPick.ritualSteps,
        products,
      });
    }

    const result = await recommendFromLarsaProfile(profile);
    const insight = await enrichLarsaRecommendations(profile, result.products, {
      ritualSteps: result.ritualSteps,
      ritualNote: result.ritualNote,
    });

    const insightMap = new Map(
      (insight?.productInsights ?? []).map((pi) => [pi.productId, pi.whyAr]),
    );

    const products = toRecommendationPayload(result.products).map((p) => ({
      ...p,
      whyAr: insightMap.get(p.id) ?? null,
    }));

    return NextResponse.json({
      ok: true,
      aiSelected: false,
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
