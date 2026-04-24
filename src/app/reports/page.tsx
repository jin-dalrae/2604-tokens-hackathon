"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface JobSummary {
  id: string;
  company: string;
  status: string;
  createdAt: string;
  ghostUrl?: string;
  ghostExternal?: boolean;
  sensoUrl?: string;
}

export default function ReportsIndex() {
  const [jobs, setJobs] = useState<JobSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch("/api/reports", { cache: "no-store" });
      const d = (await res.json()) as { jobs: JobSummary[] };
      if (!cancelled) setJobs(d.jobs);
    };
    void load();
    const t = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <section className="max-w-5xl mx-auto w-full px-6 py-12 space-y-8">
      <header className="space-y-3">
        <span className="nn-label">Reports</span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Every company{" "}
          <span className="nn-gradient-text">SuperBrain has researched.</span>
        </h1>
        <p className="text-[var(--on-surface-variant)] max-w-2xl">
          Each report is published to three surfaces: the app (paywalled deep view), Ghost Pro
          (free public summary + WebGL embed), and cited.md (agent-native citeable via Senso).
        </p>
      </header>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--on-surface-variant)]">
          {jobs ? `${jobs.length} ${jobs.length === 1 ? "run" : "runs"}` : "loading…"}
        </span>
        <Link href="/" className="nn-btn-ghost">+ new research</Link>
      </div>

      <div className="nn-card nn-card-lg divide-y divide-white/5 overflow-hidden">
        {!jobs && (
          <div className="p-6 text-[var(--on-surface-variant)]">Loading reports…</div>
        )}
        {jobs && jobs.length === 0 && (
          <div className="p-6 text-[var(--on-surface-variant)]">
            No reports yet. <Link href="/" className="text-[var(--primary)] underline">Run one.</Link>
          </div>
        )}
        {jobs?.map((j) => (
          <div key={j.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3">
                <Link
                  href={`/report/${j.id}`}
                  className="text-lg font-semibold hover:text-[var(--primary)] transition-colors"
                >
                  {j.company}
                </Link>
                <StatusChip status={j.status} />
              </div>
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--on-surface-variant)]/70">
                {j.id} · {j.createdAt.split("T")[0]}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <Link href={`/report/${j.id}`} className="nn-btn-ghost">open report →</Link>
              {j.ghostExternal && j.ghostUrl && (
                <a href={j.ghostUrl} target="_blank" rel="noopener noreferrer" className="nn-btn-ghost">
                  ghost ↗
                </a>
              )}
              {j.sensoUrl && (
                <a href={j.sensoUrl} target="_blank" rel="noopener noreferrer" className="nn-btn-ghost">
                  cited.md ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  const style =
    status === "done"
      ? "border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]"
      : status === "error"
      ? "border-red-400/40 bg-red-500/10 text-red-300"
      : "border-[var(--secondary)]/40 bg-[var(--secondary)]/10 text-[var(--secondary-soft)]";
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full border ${style}`}
    >
      {status === "running" && <span className="w-1.5 h-1.5 rounded-full bg-current nn-pulse" />}
      {status}
    </span>
  );
}
