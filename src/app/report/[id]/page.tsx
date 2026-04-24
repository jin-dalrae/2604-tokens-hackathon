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
  sensoUrl?: string;
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ReportState | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/research/${id}`, { cache: "no-store" });
    if (!res.ok) return setError("Report not found");
    setData((await res.json()) as ReportState);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

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

  if (error) return <div className="p-8 text-red-300">{error}</div>;
  if (!data) return <div className="p-8 text-[var(--on-surface-variant)]">Loading report…</div>;
  if (!data.insight) {
    return (
      <div className="p-8 text-[var(--on-surface-variant)]">
        Report not ready yet. <a className="underline text-[var(--primary)]" href={`/research/${id}`}>Back to agent</a>
      </div>
    );
  }
  const insight = data.insight;

  return (
    <section className="max-w-7xl mx-auto w-full px-6 py-10 space-y-8">
      {/* Header */}
      <header className="nn-card nn-card-lg px-8 py-7 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="nn-chip">Intelligence Report · live</span>
          <span className="nn-chip" style={{
            background: "rgba(0,240,255,0.10)", borderColor: "rgba(0,240,255,0.35)", color: "var(--primary-soft)"
          }}>
            cross-referenced
          </span>
          {data.ghostExternal && data.ghostUrl && (
            <a href={data.ghostUrl} target="_blank" rel="noopener noreferrer" className="nn-chip hover:opacity-80">
              ghost post ↗
            </a>
          )}
          {data.sensoUrl && (
            <a href={data.sensoUrl} target="_blank" rel="noopener noreferrer" className="nn-chip hover:opacity-80">
              cited.md ↗
            </a>
          )}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          {insight.name}
          <span className="nn-gradient-text"> · intelligence</span>
        </h1>
        <p className="text-[var(--on-surface-variant)] max-w-3xl leading-relaxed">
          {insight.summary}
        </p>
        <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--on-surface-variant)]/70 uppercase">
          generated {insight.generatedAt} · {insight.sources.length} sources
        </div>
      </header>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Headcount" value={insight.employeeTrend.headcount.toString()} sub="linkedin" />
        <Stat
          label="30-day Growth"
          value={`${(insight.employeeTrend.growth30d * 100).toFixed(1)}%`}
          sub={insight.employeeTrend.signal}
          tone={insight.employeeTrend.signal === "hiring" ? "pos" : insight.employeeTrend.signal === "layoffs" ? "neg" : "neu"}
        />
        <Stat
          label="Public Sentiment"
          value={insight.publicSentiment.score.toFixed(2)}
          sub={insight.publicSentiment.trend}
          tone={insight.publicSentiment.trend === "up" ? "pos" : insight.publicSentiment.trend === "down" ? "neg" : "neu"}
        />
      </div>

      {/* Knowledge map */}
      <section className="nn-card nn-card-lg p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="nn-label">Knowledge Map</div>
            <div className="text-xs text-[var(--on-surface-variant)]">Drag to rotate · scroll to zoom · embedded in every Ghost post</div>
          </div>
          <EmbedActions id={insight.id} />
        </div>
        <KnowledgeMap insight={insight} />
      </section>

      {/* Claims vs sentiment */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Block title="Official Claims" tint="primary">
          <ul className="space-y-2">
            {insight.officialClaims.map((c, i) => (
              <li key={i} className="text-sm leading-relaxed">{c}</li>
            ))}
          </ul>
        </Block>
        <Block title="Public Signal" tint="secondary">
          <ul className="space-y-2">
            {insight.publicSentiment.sampleMentions.length === 0 && (
              <li className="text-sm text-[var(--on-surface-variant)]">No public mentions fetched this run.</li>
            )}
            {insight.publicSentiment.sampleMentions.map((m, i) => (
              <li key={i} className="text-sm leading-relaxed">{m}</li>
            ))}
          </ul>
        </Block>
      </section>

      {/* Deep research, paywalled */}
      <section className="relative space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="nn-label">Deep Research</div>
            <div className="text-xs text-[var(--on-surface-variant)] mt-1">
              Contradictions · key people · competitors · full sources
            </div>
          </div>
          {data.paid && <span className="nn-chip">unlocked</span>}
        </div>
        <div className="relative">
          <div className={data.paid ? "space-y-5" : "space-y-5 blur-[10px] pointer-events-none select-none"}>
            <Block title="Contradictions" tint="secondary">
              {insight.contradictions.length === 0 ? (
                <p className="text-sm text-[var(--on-surface-variant)]">None surfaced this run.</p>
              ) : (
                <ul className="space-y-3">
                  {insight.contradictions.map((c, i) => (
                    <li key={i} className="rounded-lg border border-white/5 bg-black/30 p-3 space-y-1">
                      <div className="text-sm font-semibold">{c.claim}</div>
                      <div className="text-sm text-[var(--on-surface-variant)]">{c.counterEvidence}</div>
                      <div className="font-mono text-[10px] text-[var(--on-surface-variant)]/70 tracking-wider">
                        official {c.officialSource} · counter {c.counterSource}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Block>
            <Block title="Key People" tint="primary">
              <ul className="space-y-1.5 text-sm">
                {insight.keyPeople.map((p, i) => (
                  <li key={i}>
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-[var(--on-surface-variant)]"> — {p.role}</span>
                  </li>
                ))}
              </ul>
            </Block>
            <Block title="Competitors" tint="secondary">
              <ul className="space-y-1.5 text-sm">
                {insight.competitors.map((c, i) => (
                  <li key={i}>
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-[var(--on-surface-variant)]"> — {c.overlap} · {(c.strength * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </Block>
            <Block title="Sources" tint="primary">
              <ul className="font-mono text-[11px] space-y-1">
                {insight.sources.map((s, i) => (
                  <li key={i} className="text-[var(--on-surface-variant)]">
                    [{s.kind}] {s.title} — <a className="underline hover:text-[var(--primary)]" href={s.url}>{s.url}</a>
                  </li>
                ))}
              </ul>
            </Block>
          </div>

          {!data.paid && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="nn-card nn-card-lg p-8 max-w-md text-center space-y-4 nn-glow-primary">
                <div className="nn-label">x402 · coinbase cdp</div>
                <div className="text-2xl font-bold">Unlock deep research</div>
                <p className="text-sm text-[var(--on-surface-variant)]">
                  1.00 USDC unlocks contradictions, key people, full competitor list, and the
                  complete source bibliography. Payment settles on-chain via Coinbase Developer
                  Platform.
                </p>
                <button
                  onClick={unlock}
                  disabled={paying}
                  className="nn-btn-primary w-full flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[var(--on-primary)] nn-pulse" />
                      settling…
                    </>
                  ) : (
                    <>Pay 1 USDC →</>
                  )}
                </button>
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--on-surface-variant)]/70">
                  agent-native · per-report · no subscription
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function Stat({
  label, value, sub, tone = "neu",
}: { label: string; value: string; sub?: string; tone?: "pos" | "neg" | "neu" }) {
  const color = tone === "pos"
    ? "text-[var(--primary)]"
    : tone === "neg"
    ? "text-red-300"
    : "text-[var(--on-surface)]";
  return (
    <div className="nn-card nn-card-lg p-5 flex flex-col gap-1.5">
      <span className="nn-label">{label}</span>
      <span className={`text-3xl font-bold tracking-tight ${color}`}>{value}</span>
      {sub && (
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--on-surface-variant)]/80">
          {sub}
        </span>
      )}
    </div>
  );
}

function Block({ title, tint = "primary", children }: {
  title: string; tint?: "primary" | "secondary"; children: React.ReactNode;
}) {
  const accent = tint === "primary" ? "var(--primary)" : "var(--secondary)";
  return (
    <div
      className="nn-card p-5 border-l-2"
      style={{ borderLeftColor: accent }}
    >
      <div className="nn-label mb-3">{title}</div>
      {children}
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
    <div className="flex gap-2">
      <button onClick={openWindow} className="nn-btn-ghost">open window ↗</button>
      <button onClick={copyEmbed} className="nn-btn-ghost">
        {copied ? "copied ✓" : "copy iframe"}
      </button>
    </div>
  );
}
