import {
  convertToModelMessages,
  generateText,
  isStepCount,
  streamText,
  type UIMessage,
} from "ai";
import { getAdvisorModel } from "@/lib/advisor/model";
import { buildAdvisorSystemPrompt } from "@/lib/advisor/prompt";
import { advisorTools } from "@/lib/advisor/tools";
import {
  resolveProductsByIdsOrSlugs,
  toRecommendationPayload,
} from "@/lib/advisor/catalog";
import type { Product } from "@/types";

export const ADVISOR_AGENT_TEMPERATURE = 0.4;
export const ADVISOR_AGENT_MAX_STEPS = 10;

/** Streaming chat agent for /api/advisor */
export async function streamLarsaAgent(messages: UIMessage[]) {
  const model = getAdvisorModel();
  if (!model) return null;

  const system = await buildAdvisorSystemPrompt();
  return streamText({
    model,
    system,
    messages: await convertToModelMessages(messages),
    tools: advisorTools,
    stopWhen: isStepCount(ADVISOR_AGENT_MAX_STEPS),
    temperature: ADVISOR_AGENT_TEMPERATURE,
  });
}

export type QuizAgentSelection = {
  products: Product[];
  ritualSteps: string[];
  ritualNote: string;
  introLine: string | null;
  aiSelected: boolean;
};

/**
 * Non-streaming agent pass for quiz answers → grounded product picks.
 * Returns null when no model / failure so caller can use heuristics.
 */
export async function selectProductsWithLarsaAgent(profileText: string): Promise<QuizAgentSelection | null> {
  const model = getAdvisorModel();
  if (!model) return null;

  try {
    const system = await buildAdvisorSystemPrompt();
    const { steps, text } = await generateText({
      model,
      system,
      tools: advisorTools,
      stopWhen: isStepCount(ADVISOR_AGENT_MAX_STEPS),
      temperature: ADVISOR_AGENT_TEMPERATURE,
      prompt: `الاستشارة التالية من اختبار لارسا الموجّه. اختاري منتجات VELORA المناسبة بدقة عبر الأدوات فقط.

${profileText}

المطلوب منكِ:
1) استدعِ searchCatalog مرة أو أكثر حسب الفئة والاهتمام والميزانية.
2) إن لزم، getProductDetails لمنتجين مرشّحين.
3) أنهِ بـ recommendProducts و/أو buildRitual بمعرّفات حقيقية من النتائج.
4) لا تختلقي منتجات.`,
    });

    let productIds: string[] = [];
    let ritualSteps: string[] = [];
    let ritualNote = "";

    for (const step of steps) {
      for (const call of step.toolCalls ?? []) {
        if (call.toolName === "recommendProducts") {
          const input = call.input as {
            productIds?: string[];
            ritualSteps?: string[];
            ritualNote?: string;
          };
          if (input.productIds?.length) productIds = input.productIds;
          if (input.ritualSteps?.length) ritualSteps = input.ritualSteps;
          if (input.ritualNote) ritualNote = input.ritualNote;
        }
        if (call.toolName === "buildRitual") {
          const input = call.input as {
            productIds?: string[];
            ritualSteps?: string[];
            ritualNote?: string;
          };
          if (input.productIds?.length) productIds = input.productIds;
          if (input.ritualSteps?.length) ritualSteps = input.ritualSteps;
          if (input.ritualNote) ritualNote = input.ritualNote;
        }
      }
      for (const result of step.toolResults ?? []) {
        if (
          result.toolName === "recommendProducts" ||
          result.toolName === "buildRitual"
        ) {
          const output = result.output as {
            products?: Array<{ id: string }>;
            ritualSteps?: string[] | null;
            ritualNote?: string | null;
          };
          if (output.products?.length) {
            productIds = output.products.map((p) => p.id);
          }
          if (output.ritualSteps?.length) ritualSteps = output.ritualSteps;
          if (output.ritualNote) ritualNote = output.ritualNote;
        }
      }
    }

    if (!productIds.length) return null;

    const products = await resolveProductsByIdsOrSlugs(productIds);
    if (!products.length) return null;

    const introLine =
      text
        ?.split("\n")
        .map((l) => l.trim())
        .find((l) => l.length > 12 && l.length < 160) ?? null;

    return {
      products: products.slice(0, 4),
      ritualSteps:
        ritualSteps.length > 0
          ? ritualSteps
          : products.map(
              (p, i) => `${i + 1}. ${p.nameAr}`,
            ),
      ritualNote:
        ritualNote ||
        "رتّبت المنتجات حسب احتياجكِ من الاستشارة — ابدئي بلطف وراقبي تحمّل بشرتكِ.",
      introLine,
      aiSelected: true,
    };
  } catch (error) {
    console.error("[larsa/agent] quiz selection failed", error);
    return null;
  }
}

/** Helper for debugging / tests — ensure payload only uses resolved products */
export function groundedRecommendationPayload(products: Product[]) {
  return toRecommendationPayload(products);
}
