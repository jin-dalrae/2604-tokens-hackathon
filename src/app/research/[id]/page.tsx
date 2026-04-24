"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import type { AgentEvent } from "@/lib/types";

const KIND_LABEL: Record<AgentEvent["kind"], string> = {
  queued: "queue",
  browse: "tinyfish",
  extract: "structure",
  memory: "redis",
  synthesize: "synth",
  publish: "ghost+senso",
  done: "done",
  error: "error",
};

const STAGES: { kind: AgentEvent["kind"]; label: string; sub: string }[] = [
  { kind: "queued", label: "Queue", sub: "Agent spinning up" },
  { kind: "browse", label: "Browse", sub: "TinyFish across open web" },
  { kind: "extract", label: "Structure", sub: "Raw pages → typed facts" },
  { kind: "memory", label: "Memory", sub: "Redis semantic store + contradictions" },
  { kind: "synthesize", label: "Synthesize", sub: "Composing CompanyInsight" },
  { kind: "publish", label: "Publish", sub: "Ghost + Senso cited.md" },
];

export default function ResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const [company, setCompany] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/research/${id}`).then(r => r.json()).then(d => setCompany(d.company));
  }, [id]);

  useEffect(() => {
    const es = new EventSource(`/api/research/${id}/stream`);
    es.onmessage = (msg) => {
      const e = JSON.parse(msg.data) as AgentEvent;
      setEvents((prev) => [...prev, e]);
      if (e.kind === "done") {
        setStatus("done");
        setTimeout(() => router.push(`/report/${id}`), 700);
        es.close();
      } else if (e.kind === "error") {
        setStatus("error");
        es.close();
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [id, router]);

  const groups = useMemo(() => groupStages(events), [events]);
  const activeStage = useMemo(() => currentStage(events, status), [events, status]);

  return (
    <section className="nn-grid flex-1 grid grid-cols-12 gap-6 px-6 py-6">
      {/* Sidebar */}
      <aside className="col-span-12 md:col-span-4 nn-card nn-card-lg p-6 flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <div>
            <div className="nn-label">Agent Status</div>
            <div className="mt-1 text-lg font-semibold">{company ?? "…"}</div>
          </div>
          <span className={`nn-chip ${statusChip(status)}`}>{status}</span>
        </header>

        <ol className="space-y-2.5">
          {STAGES.map((stage) => {
            const list = groups[stage.kind] ?? [];
            const state = stageState(stage.kind, list, activeStage, status);
            return (
              <li
                key={stage.kind}
                className={`relative rounded-xl border p-3 transition-colors ${
                  state === "active"
                    ? "border-[var(--primary)] bg-[rgba(0,240,255,0.06)] nn-glow-primary"
                    : state === "done"
                    ? "border-[var(--secondary)]/40 bg-[rgba(182,0,248,0.04)]"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="nn-label text-[10px]">{stage.label}</span>
                    <span className="text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                      {stage.sub}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] tracking-[0.18em] uppercase ${
                      state === "active"
                        ? "text-[var(--primary)]"
                        : state === "done"
                        ? "text-[var(--secondary-soft)]"
                        : "text-[var(--on-surface-variant)]/40"
                    }`}
                  >
                    {state === "active" ? "• live" : state === "done" ? "ok" : "—"}
                  </span>
                </div>
                {list.length > 0 && (
                  <ul className="mt-2 space-y-0.5 pl-1">
                    {list.slice(-3).map((e) => (
                      <li
                        key={e.id}
                        className="font-mono text-[10px] tracking-[0.04em] text-[var(--on-surface-variant)] truncate"
                      >
                        → {e.label}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Event log */}
      <div className="col-span-12 md:col-span-8 nn-card nn-card-lg p-6 flex flex-col gap-4 min-h-[70vh]">
        <div className="flex items-center justify-between">
          <div className="nn-label">Live Event Stream</div>
          <span className="font-mono text-[10px] text-[var(--on-surface-variant)]">
            job {id} · {events.length} events
          </span>
        </div>
        <div className="flex-1 overflow-auto font-mono text-[12px] rounded-lg bg-black/40 border border-white/5 divide-y divide-white/5">
          {events.length === 0 && (
            <div className="p-5 text-[var(--on-surface-variant)]">Waiting for the agent to report in…</div>
          )}
          {events.map((e) => (
            <div
              key={e.id}
              className="px-4 py-2.5 flex gap-4 hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-[var(--outline)] w-20 shrink-0">
                {e.at.split("T")[1]?.split(".")[0]}
              </span>
              <span
                className={`w-24 shrink-0 ${kindColor(e.kind)}`}
              >
                [{KIND_LABEL[e.kind]}]
              </span>
              <span className="flex-1 text-[var(--on-surface)]">{e.label}</span>
              {e.sourceUrl && (
                <span className="text-[var(--on-surface-variant)] truncate max-w-[35%] text-right">
                  {e.sourceUrl}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function groupStages(events: AgentEvent[]): Record<string, AgentEvent[]> {
  const out: Record<string, AgentEvent[]> = {};
  for (const e of events) (out[e.kind] ??= []).push(e);
  return out;
}

function currentStage(events: AgentEvent[], status: string): AgentEvent["kind"] | null {
  if (status === "done") return null;
  for (let i = events.length - 1; i >= 0; i--) {
    const k = events[i].kind;
    if (k !== "done" && k !== "error") return k;
  }
  return null;
}

function stageState(
  kind: AgentEvent["kind"],
  list: AgentEvent[],
  active: AgentEvent["kind"] | null,
  status: string,
): "pending" | "active" | "done" {
  if (list.length === 0) return "pending";
  if (kind === active && status === "running") return "active";
  return "done";
}

function statusChip(s: string): string {
  if (s === "done") return "!text-[var(--primary)] !border-[var(--primary)]/40 !bg-[var(--primary)]/10";
  if (s === "error") return "!text-red-300 !border-red-400/40 !bg-red-500/10";
  return "";
}

function kindColor(k: AgentEvent["kind"]): string {
  switch (k) {
    case "browse":
    case "extract":
    case "memory":
      return "text-[var(--primary)]";
    case "synthesize":
      return "text-[var(--secondary-soft)]";
    case "publish":
    case "done":
      return "text-[var(--primary-soft)]";
    case "error":
      return "text-red-300";
    default:
      return "text-[var(--on-surface-variant)]";
  }
}
