import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  type UIMessage,
} from "ai";
import { getAdvisorModel, getAdvisorProvider } from "@/lib/advisor/model";
import { buildAdvisorSystemPrompt } from "@/lib/advisor/prompt";
import { advisorTools } from "@/lib/advisor/tools";
import {
  extractLatestUserText,
  toRecommendationPayload,
} from "@/lib/advisor/catalog";
import { buildAdvisorReply, recommendProducts } from "@/data/advisor";

export const maxDuration = 60;

export async function GET() {
  const provider = getAdvisorProvider();
  return Response.json({
    ok: true,
    provider,
    aiEnabled: provider !== "local",
    label:
      provider === "openai"
        ? "OpenAI"
        : provider === "google"
          ? "Google Gemini"
          : "مستشارة VELORA المحلية",
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const messages = (body.messages ?? []) as UIMessage[];
  const model = getAdvisorModel();

  if (model) {
    try {
      const system = await buildAdvisorSystemPrompt();
      const result = streamText({
        model,
        system,
        messages: await convertToModelMessages(messages),
        tools: advisorTools,
        stopWhen: isStepCount(6),
        temperature: 0.65,
      });

      return result.toUIMessageStreamResponse();
    } catch (error) {
      console.error("[advisor] AI provider failed, using local fallback", error);
      return localAdvisorStream(messages);
    }
  }

  return localAdvisorStream(messages);
}

async function localAdvisorStream(messages: UIMessage[]) {
  const userText = extractLatestUserText(messages);
  const reply = await buildAdvisorReply(userText || "مرحبا");
  const recs = await recommendProducts(userText || "");
  const payload = {
    products: toRecommendationPayload(recs),
    ritualNote: "ابدئي بلطف: تنظيف ثم علاج ثم ترطيب.",
    count: recs.length,
  };

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const textId = "local-text";
      writer.write({ type: "text-start", id: textId });

      const chunks = chunkArabic(reply, 18);
      for (const chunk of chunks) {
        writer.write({ type: "text-delta", id: textId, delta: chunk });
        await sleep(16);
      }
      writer.write({ type: "text-end", id: textId });

      const toolCallId = `local-tool-${Date.now()}`;
      writer.write({
        type: "tool-input-available",
        toolCallId,
        toolName: "recommendProducts",
        input: {
          productIds: recs.map((p) => p.id),
          ritualNote: payload.ritualNote,
        },
      });
      writer.write({
        type: "tool-output-available",
        toolCallId,
        output: payload,
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

function chunkArabic(text: string, size: number) {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.slice(i, i + size));
  }
  return parts.length ? parts : [text];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
