/**
 * Offline structure verification for Larsa agent wiring.
 * Avoids importing DB-backed modules (no DATABASE_URL required).
 * Run: npx tsx scripts/verify-larsa-agent.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

async function main() {
  let passed = 0;
  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      console.log(`✓ ${name}`);
    } catch (e) {
      console.error(`✗ ${name}`);
      throw e;
    }
  }

  test("core agent files exist", () => {
    for (const f of [
      "src/lib/advisor/agent.ts",
      "src/lib/advisor/tools.ts",
      "src/lib/advisor/catalog.ts",
      "src/lib/advisor/prompt.ts",
      "src/lib/advisor/model.ts",
      "src/app/api/advisor/route.ts",
      "src/app/api/larsa/recommend/route.ts",
      "src/components/advisor/LarsaChat.tsx",
      "src/components/advisor/LarsaLobby.tsx",
      "src/components/advisor/LarsaExperience.tsx",
      "src/components/advisor/LarsaResults.tsx",
    ]) {
      assert.ok(existsSync(join(root, f)), `missing ${f}`);
    }
  });

  test("tools export grounding set", () => {
    const src = read("src/lib/advisor/tools.ts");
    assert.match(src, /searchCatalog/);
    assert.match(src, /getProductDetails/);
    assert.match(src, /recommendProducts/);
    assert.match(src, /buildRitual/);
  });

  test("catalog has stronger search + product details", () => {
    const src = read("src/lib/advisor/catalog.ts");
    assert.match(src, /getCatalogSummaryForPrompt/);
    assert.match(src, /getProductDetailsByIdOrSlug/);
    assert.match(src, /searchCatalog/);
  });

  test("prompt uses summary + tool protocol (no full dump)", () => {
    const src = read("src/lib/advisor/prompt.ts");
    assert.match(src, /searchCatalog/);
    assert.match(src, /getProductDetails/);
    assert.match(src, /recommendProducts/);
    assert.match(src, /buildRitual/);
    assert.match(src, /getCatalogSummaryForPrompt/);
    assert.ok(!src.includes("JSON.stringify(await getCatalogForPrompt()"));
  });

  test("model defaults favor stronger models", () => {
    const src = read("src/lib/advisor/model.ts");
    assert.match(src, /gpt-4o/);
    assert.match(src, /gemini-2\.0-flash/);
  });

  test("agent runner: temp 0.4 + shared stream + quiz select", () => {
    const src = read("src/lib/advisor/agent.ts");
    assert.match(src, /ADVISOR_AGENT_TEMPERATURE = 0\.4/);
    assert.match(src, /streamLarsaAgent/);
    assert.match(src, /selectProductsWithLarsaAgent/);
    assert.match(src, /isStepCount/);
  });

  test("chat API uses shared agent", () => {
    const src = read("src/app/api/advisor/route.ts");
    assert.match(src, /streamLarsaAgent/);
  });

  test("quiz API prefers agent then heuristics", () => {
    const src = read("src/app/api/larsa/recommend/route.ts");
    assert.match(src, /selectProductsWithLarsaAgent/);
    assert.match(src, /recommendFromLarsaProfile/);
    assert.match(src, /aiSelected/);
  });

  test("UI: tool thinking + provider badge + results bridge", () => {
    const chat = read("src/components/advisor/LarsaChat.tsx");
    assert.match(chat, /thinkingLabelFromMessages/);
    assert.match(chat, /تبحث في كتالوج/);
    assert.match(chat, /offlineMode/);

    const lobby = read("src/components/advisor/LarsaLobby.tsx");
    assert.match(lobby, /aiEnabled/);
    assert.match(lobby, /وكيل ذكاء مفعّل/);

    const exp = read("src/components/advisor/LarsaExperience.tsx");
    assert.match(exp, /continueFromResults/);
    assert.match(exp, /\/api\/advisor/);

    const results = read("src/components/advisor/LarsaResults.tsx");
    assert.match(results, /onContinueWithLarsa|كمّلي مع لارسا/);
  });

  console.log(`\n${passed} Larsa agent structure checks passed`);
  console.log(
    "Golden scenarios (manual with AI key): dry skin summer Iraq <50k; Anua+moisturizer ritual; niacinamide Q; missing SKU apology; full skincare quiz.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
