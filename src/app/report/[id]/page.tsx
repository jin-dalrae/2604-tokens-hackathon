"use client";

import { use, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { CompanyInsight } from "@/lib/types";

const KnowledgeMap = dynamic(() => import("@/components/KnowledgeMap"), { ssr: false });

interface ReportState {
  id: string;
  company: string;
  status: string;
  insight?: CompanyInsight;
  paid: boolean;
  ghostUrl?: string;
  ghostExternal?: boolean;
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ReportState | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/research/${id}`, { cache: "no-store" });
    if (!res.ok) {
      setError("Report not found");
      return;
    }
    setData((await res.json()) as ReportState);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function unlock() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/pay/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payer: "demo-wallet", signature: "sim_demo_unlock" }),
      });
      if (!res.ok) throw new Error("payment failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "payment failed");
    } finally {
      setPaying(false);
    }
  }

  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!data) return <div className="p-6 text-neutral-400">Loading report…</div>;
  if (!data.insight)
    return (
      <div className="p-6 text-neutral-400">
        Report not ready yet. <a className="underline" href={`/research/${id}`}>Back to agent</a>
      </div>
    );

  const insight = data.insight;

  return (
    <section className="max-w-6xl mx-auto w-full px-6 py-8 space-y-8">
      <header className="space-y-2 border-b border-neutral-800 pb-5">
        <div className="text-xs font-mono uppercase text-neutral-500">Intelligence Report</div>
        <h1 className="text-3xl font-semibold">{insight.name}</h1>
        <p className="text-neutral-400 text-sm max-w-2xl">{insight.summary}</p>
        <div className="text-[10px] font-mono text-neutral-500">
          generated {insight.generatedAt} · {insight.sources.length} sources
        </div>
        {data.ghostExternal && data.ghostUrl && (
          <a
            href={data.ghostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-mono text-emerald-400 border border-emerald-400/40 rounded px-3 py-1.5 hover:bg-emerald-400/10"
          >
            view on ghost ↗ {data.ghostUrl}
          </a>
        )}
      </header>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Headcount" value={insight.employeeTrend.headcount.toString()} />
        <Stat
          label="30d growth"
          value={`${(insight.employeeTrend.growth30d * 100).toFixed(1)}%`}
          tone={insight.employeeTrend.signal === "hiring" ? "pos" : "neu"}
        />
        <Stat
          label="Sentiment"
          value={insight.publicSentiment.score.toFixed(2)}
          tone={insight.publicSentiment.trend === "up" ? "pos" : insight.publicSentiment.trend === "down" ? "neg" : "neu"}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400">Knowledge Map</h2>
          <EmbedActions id={insight.id} />
        </div>
        <KnowledgeMap insight={insight} />
      </section>

      <section className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-sm font-mono uppercase tracking-widest text-neutral-400">Official claims</h3>
          <ul className="text-sm text-neutral-200 space-y-1 list-disc pl-4">
            {insight.officialClaims.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-mono uppercase tracking-widest text-neutral-400">Public sentiment</h3>
          <ul className="text-sm text-neutral-200 space-y-1 list-disc pl-4">
            {insight.publicSentiment.sampleMentions.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative">
        <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-3">
          Deep Research · contradictions, people, sources
        </h2>
        <div className={data.paid ? "" : "relative"}>
          <div className={data.paid ? "" : "blur-sm pointer-events-none select-none"}>
            <div className="space-y-5">
              <Block title="Contradictions">
                {insight.contradictions.length === 0 ? (
                  <p className="text-sm text-neutral-400">None found.</p>
                ) : (
                  insight.contradictions.map((c, i) => (
                    <div key={i} className="border border-neutral-800 rounded p-3 text-sm space-y-1">
                      <div className="font-semibold">{c.claim}</div>
                      <div className="text-neutral-400">{c.counterEvidence}</div>
                      <div className="text-xs font-mono text-neutral-500">
                        official: {c.officialSource} · counter: {c.counterSource}
                      </div>
                    </div>
                  ))
                )}
              </Block>
              <Block title="Key people">
                <ul className="text-sm space-y-1">
                  {insight.keyPeople.map((p, i) => (
                    <li key={i} className="text-neutral-200">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-neutral-500"> — {p.role}</span>
                    </li>
                  ))}
                </ul>
              </Block>
              <Block title="Competitors">
                <ul className="text-sm space-y-1">
                  {insight.competitors.map((c, i) => (
                    <li key={i} className="text-neutral-200">
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-neutral-500"> — {c.overlap} ({(c.strength * 100).toFixed(0)}%)</span>
                    </li>
                  ))}
                </ul>
              </Block>
              <Block title="Sources">
                <ul className="text-xs font-mono space-y-1">
                  {insight.sources.map((s, i) => (
                    <li key={i} className="text-neutral-400">
                      [{s.kind}] {s.title} — {s.url}
                    </li>
                  ))}
                </ul>
              </Block>
            </div>
          </div>
          {!data.paid && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border border-emerald-400/40 bg-neutral-950/90 rounded-lg p-6 max-w-sm text-center space-y-3">
                <div className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                  x402 · micro-payment
                </div>
                <div className="text-lg font-semibold">Unlock deep research</div>
                <p className="text-xs text-neutral-400">
                  1.00 USDC unlocks contradictions, people, competitors, and full source list.
                </p>
                <button
                  onClick={unlock}
                  disabled={paying}
                  className="w-full border border-emerald-400 text-emerald-400 rounded px-4 py-2 text-sm font-mono uppercase tracking-wider disabled:opacity-50"
                >
                  {paying ? "settling…" : "pay 1 USDC"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function Stat({ label, value, tone = "neu" }: { label: string; value: string; tone?: "pos" | "neg" | "neu" }) {
  const color = tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-red-400" : "text-neutral-100";
  return (
    <div className="border border-neutral-800 rounded p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function EmbedActions({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const openWindow = () => {
    window.open(
      `/embed/map/${id}`,
      `superbrain-map-${id}`,
      "noopener,noreferrer,width=1100,height=720",
    );
  };
  const copyEmbed = async () => {
    const origin = window.location.origin;
    const html = `<iframe src="${origin}/embed/map/${id}" width="100%" height="520" frameborder="0" allowfullscreen></iframe>`;
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="flex gap-2 text-[10px] font-mono">
      <button
        onClick={openWindow}
        className="border border-neutral-700 hover:border-emerald-400 hover:text-emerald-400 px-2 py-1 rounded uppercase tracking-widest"
      >
        open window ↗
      </button>
      <button
        onClick={copyEmbed}
        className="border border-neutral-700 hover:border-emerald-400 hover:text-emerald-400 px-2 py-1 rounded uppercase tracking-widest"
      >
        {copied ? "copied ✓" : "copy iframe"}
      </button>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-800 rounded p-4 space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">{title}</div>
      {children}
    </div>
  );
}
