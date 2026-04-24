"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import type { AgentEvent } from "@/lib/types";

const KIND_LABEL: Record<AgentEvent["kind"], string> = {
  queued: "queue",
  browse: "tinyfish",
  extract: "nexla",
  memory: "redis",
  synthesize: "synth",
  publish: "ghost",
  done: "done",
  error: "error",
};

export default function ResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<"running" | "done" | "error">("running");

  useEffect(() => {
    const es = new EventSource(`/api/research/${id}/stream`);
    es.onmessage = (msg) => {
      const e = JSON.parse(msg.data) as AgentEvent;
      setEvents((prev) => [...prev, e]);
      if (e.kind === "done") {
        setStatus("done");
        setTimeout(() => router.push(`/report/${id}`), 600);
        es.close();
      } else if (e.kind === "error") {
        setStatus("error");
        es.close();
      }
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [id, router]);

  const groups = useMemo(() => groupStages(events), [events]);

  return (
    <section className="flex-1 grid grid-cols-12 gap-0">
      <aside className="col-span-4 border-r border-neutral-800 p-5 space-y-4 min-h-full">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase text-neutral-500">Agent status</div>
          <div className="text-sm font-mono">
            job <span className="text-emerald-400">{id}</span>
          </div>
          <div className="text-xs font-mono text-neutral-500">
            status: <span className={statusColor(status)}>{status}</span>
          </div>
        </div>
        <ol className="space-y-3">
          {STAGES.map((stage) => (
            <li key={stage.kind} className="border border-neutral-800 rounded p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest">
                  {stage.label}
                </span>
                <span className={`text-[10px] font-mono ${stageColor(groups[stage.kind])}`}>
                  {stageMark(groups[stage.kind], status)}
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-neutral-400 font-mono">
                {(groups[stage.kind] ?? []).map((e) => (
                  <li key={e.id} className="truncate">
                    → {e.label}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </aside>
      <div className="col-span-8 p-5">
        <div className="text-xs font-mono uppercase text-neutral-500 mb-3">Event log</div>
        <div className="border border-neutral-800 rounded h-[70vh] overflow-auto font-mono text-xs">
          {events.length === 0 && (
            <div className="p-4 text-neutral-500">Waiting for agent events…</div>
          )}
          {events.map((e) => (
            <div
              key={e.id}
              className="px-4 py-1.5 border-b border-neutral-900 flex gap-3 hover:bg-neutral-900/40"
            >
              <span className="text-neutral-600">{e.at.split("T")[1]?.split(".")[0]}</span>
              <span className="text-emerald-400 w-20 shrink-0">[{KIND_LABEL[e.kind]}]</span>
              <span className="text-neutral-200 flex-1">{e.label}</span>
              {e.sourceUrl && (
                <span className="text-neutral-500 truncate max-w-[40%]">{e.sourceUrl}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STAGES: { kind: AgentEvent["kind"]; label: string }[] = [
  { kind: "queued", label: "01 · queue" },
  { kind: "browse", label: "02 · tinyfish browse" },
  { kind: "extract", label: "03 · nexla extract" },
  { kind: "memory", label: "04 · redis memory" },
  { kind: "synthesize", label: "05 · synthesize" },
  { kind: "publish", label: "06 · ghost publish" },
];

function groupStages(events: AgentEvent[]): Record<string, AgentEvent[]> {
  const out: Record<string, AgentEvent[]> = {};
  for (const e of events) {
    (out[e.kind] ??= []).push(e);
  }
  return out;
}

function stageMark(list: AgentEvent[] | undefined, status: string): string {
  if (!list || list.length === 0) return status === "running" ? "…" : "—";
  return "ok";
}

function stageColor(list: AgentEvent[] | undefined): string {
  return list && list.length > 0 ? "text-emerald-400" : "text-neutral-600";
}

function statusColor(s: string): string {
  if (s === "done") return "text-emerald-400";
  if (s === "error") return "text-red-400";
  return "text-amber-300";
}
