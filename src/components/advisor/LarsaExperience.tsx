"use client";

import { useCallback, useState } from "react";
import {
  buildConsultQuery,
  type LarsaPathDef,
} from "@/data/larsa-consultation";
import { LarsaLobby } from "@/components/advisor/LarsaLobby";
import { LarsaConsult } from "@/components/advisor/LarsaConsult";
import { LarsaAnalyzing } from "@/components/advisor/LarsaAnalyzing";
import { LarsaResults } from "@/components/advisor/LarsaResults";
import type { RecommendedProduct } from "@/components/advisor/ProductRecommendationCards";

type Phase = "lobby" | "consult" | "analyzing" | "results";

type ResultState = {
  products: RecommendedProduct[];
  ritualSteps: string[];
  ritualNote: string;
  understood: string[];
};

export function LarsaExperience() {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [path, setPath] = useState<LarsaPathDef | null>(null);
  const [pendingQuery, setPendingQuery] = useState<ReturnType<
    typeof buildConsultQuery
  > | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPhase("lobby");
    setPath(null);
    setPendingQuery(null);
    setResult(null);
    setError(null);
  };

  const startPath = (p: LarsaPathDef) => {
    setPath(p);
    setResult(null);
    setError(null);
    setPhase("consult");
  };

  const finishConsult = (payload: {
    answers: Record<string, string | string[]>;
    freeText: string;
    tags: string[];
  }) => {
    if (!path) return;
    setPendingQuery(
      buildConsultQuery(path, payload.answers, payload.freeText),
    );
    setPhase("analyzing");
  };

  const runRecommend = useCallback(async () => {
    if (!pendingQuery) {
      setPhase("results");
      return;
    }
    try {
      const res = await fetch("/api/larsa/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingQuery),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "تعذّر ترتيب التوصيات");
        setResult({
          products: [],
          ritualSteps: [],
          ritualNote: "",
          understood: pendingQuery.tags.slice(0, 5),
        });
      } else {
        setResult({
          products: data.products ?? [],
          ritualSteps: data.ritualSteps ?? [],
          ritualNote: data.ritualNote ?? "",
          understood: data.understood ?? pendingQuery.tags.slice(0, 5),
        });
      }
    } catch {
      setError("تعذّر الاتصال بلارسا. حاولي مرة أخرى.");
      setResult({
        products: [],
        ritualSteps: [],
        ritualNote: "",
        understood: pendingQuery.tags.slice(0, 5),
      });
    }
    setPhase("results");
  }, [pendingQuery]);

  if (phase === "lobby") {
    return <LarsaLobby onSelect={startPath} />;
  }

  if (phase === "consult" && path) {
    return (
      <LarsaConsult
        path={path}
        onBack={reset}
        onComplete={finishConsult}
      />
    );
  }

  if (phase === "analyzing") {
    return <LarsaAnalyzing onDone={() => void runRecommend()} />;
  }

  if (phase === "results" && path) {
    return (
      <div>
        {error ? (
          <div
            dir="rtl"
            className="border-b border-red-200/70 bg-red-50 px-5 py-3 text-center text-[0.875rem] text-red-800"
          >
            {error}
          </div>
        ) : null}
        <LarsaResults
          pathTitle={path.title}
          products={result?.products ?? []}
          ritualSteps={result?.ritualSteps ?? []}
          ritualNote={result?.ritualNote}
          understood={result?.understood ?? []}
          onRestart={reset}
        />
      </div>
    );
  }

  return <LarsaLobby onSelect={startPath} />;
}
