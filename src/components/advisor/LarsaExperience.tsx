"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildConsultQuery,
  type LarsaPathDef,
} from "@/data/larsa-consultation";
import { LarsaLobby } from "@/components/advisor/LarsaLobby";
import { LarsaConsult } from "@/components/advisor/LarsaConsult";
import { LarsaAnalyzing } from "@/components/advisor/LarsaAnalyzing";
import { LarsaResults } from "@/components/advisor/LarsaResults";
import { LarsaChat } from "@/components/advisor/LarsaChat";
import type { RecommendedProduct } from "@/components/advisor/ProductRecommendationCards";

type Phase = "lobby" | "consult" | "analyzing" | "results" | "chat";

type ResultState = {
  products: RecommendedProduct[];
  ritualSteps: string[];
  ritualNote: string;
  understood: string[];
  introLine?: string | null;
};

export function LarsaExperience() {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [path, setPath] = useState<LarsaPathDef | null>(null);
  const [pendingQuery, setPendingQuery] = useState<ReturnType<
    typeof buildConsultQuery
  > | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatPrompt, setChatPrompt] = useState<string | undefined>();
  const [aiEnabled, setAiEnabled] = useState<boolean | undefined>(undefined);
  const [providerLabel, setProviderLabel] = useState<string | undefined>();
  const chatKey = useRef(0);

  useEffect(() => {
    const ac = new AbortController();
    void fetch("/api/advisor", { signal: ac.signal })
      .then((r) => r.json())
      .then(
        (d: {
          ok?: boolean;
          aiEnabled?: boolean;
          label?: string;
        }) => {
          if (!d.ok) return;
          setAiEnabled(!!d.aiEnabled);
          setProviderLabel(d.label);
        },
      )
      .catch(() => undefined);
    return () => ac.abort();
  }, []);

  const reset = () => {
    setPhase("lobby");
    setPath(null);
    setPendingQuery(null);
    setResult(null);
    setError(null);
    setChatPrompt(undefined);
  };

  const openChat = (prompt?: string) => {
    setChatPrompt(prompt);
    chatKey.current += 1;
    setPhase("chat");
  };

  const continueFromResults = () => {
    const tags = result?.understood?.join("، ") || "";
    const names =
      result?.products?.map((p) => p.nameAr).filter(Boolean).join("، ") || "";
    const prompt = [
      "كمّلي معي بعد استشارة لارسا الموجّهة.",
      path?.title ? `المسار: ${path.title}.` : "",
      tags ? `ما فهمته عني: ${tags}.` : "",
      names ? `المنتجات المقترحة كانت: ${names}.` : "",
      "هل تناسبني؟ وما التعديلات إن احتجتِ ميزانية أو روتين صباح/مساء؟",
    ]
      .filter(Boolean)
      .join(" ");
    openChat(prompt);
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
          introLine: data.introLine ?? null,
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
    return (
      <LarsaLobby
        onSelect={startPath}
        onOpenChat={() => openChat()}
        onQuickPrompt={(prompt) => openChat(prompt)}
        aiEnabled={aiEnabled}
        providerLabel={providerLabel}
      />
    );
  }

  if (phase === "chat") {
    return (
      <LarsaChat
        key={chatKey.current}
        initialPrompt={chatPrompt}
        onBack={reset}
        offlineMode={aiEnabled === false}
      />
    );
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
          introLine={result?.introLine}
          onRestart={reset}
          onContinueChat={continueFromResults}
        />
      </div>
    );
  }

  return (
    <LarsaLobby
      onSelect={startPath}
      onOpenChat={() => openChat()}
      onQuickPrompt={(prompt) => openChat(prompt)}
      aiEnabled={aiEnabled}
      providerLabel={providerLabel}
    />
  );
}
