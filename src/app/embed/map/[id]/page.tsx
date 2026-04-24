"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { CompanyInsight } from "@/lib/types";

const KnowledgeMap = dynamic(() => import("@/components/KnowledgeMap"), { ssr: false });

// Chromeless route, designed to be iframe-embedded inside a Ghost post
// (HTML card: <iframe src="/embed/map/:id" />) OR opened in its own window
// via window.open(). No layout shell — fills 100vh/100vw.
export default function EmbedMap({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [insight, setInsight] = useState<CompanyInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/research/${id}`, { cache: "no-store" });
      if (!res.ok) return setError("not found");
      const data = (await res.json()) as { insight?: CompanyInsight };
      if (!data.insight) return setError("report not ready");
      setInsight(data.insight);
    })();
  }, [id]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-950 text-neutral-400 font-mono text-sm">
        {error}
      </div>
    );
  }
  if (!insight) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-950 text-neutral-500 font-mono text-xs">
        loading knowledge map…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-neutral-950">
      <FullscreenMap insight={insight} />
      <div className="absolute top-3 left-3 text-[10px] font-mono text-neutral-400 px-2 py-1 rounded bg-neutral-950/70 border border-neutral-800 pointer-events-none">
        {insight.name} · knowledge map
      </div>
    </div>
  );
}

function FullscreenMap({ insight }: { insight: CompanyInsight }) {
  return (
    <div className="w-full h-full [&>div]:w-full [&>div]:h-full [&>div]:border-0 [&>div]:rounded-none">
      <KnowledgeMap insight={insight} />
    </div>
  );
}
