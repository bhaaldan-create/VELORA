import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AdvisorProvider = "openai" | "google" | "local";

export function getAdvisorProvider(): AdvisorProvider {
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  ) {
    return "google";
  }
  return "local";
}

export function getAdvisorModel(): LanguageModel | null {
  const provider = getAdvisorProvider();

  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    // Prefer stronger default for accurate grounding; override via OPENAI_MODEL.
    return openai(process.env.OPENAI_MODEL?.trim() || "gpt-4o");
  }

  if (provider === "google") {
    const google = createGoogleGenerativeAI({
      apiKey:
        process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
        process.env.GEMINI_API_KEY?.trim(),
    });
    return google(process.env.GOOGLE_MODEL?.trim() || "gemini-2.0-flash");
  }

  return null;
}
