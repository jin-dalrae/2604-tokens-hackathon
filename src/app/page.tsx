"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    setBusy(true);
    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company }),
    });
    const { id } = (await res.json()) as { id: string };
    router.push(`/research/${id}`);
  }

  return (
    <section className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Research any company.</h1>
          <p className="text-neutral-400 text-sm">
            SuperBrain drives a headless browser, cross-references the website against LinkedIn and X, and
            publishes a cited intelligence report.
          </p>
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <input
            className="flex-1 border border-neutral-700 bg-neutral-900 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            placeholder="Company name (e.g. Stripe)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={busy}
            autoFocus
          />
          <button
            className="border border-emerald-400 text-emerald-400 px-4 py-2 rounded text-sm font-mono uppercase tracking-wider disabled:opacity-50"
            type="submit"
            disabled={busy || !company.trim()}
          >
            {busy ? "..." : "Launch"}
          </button>
        </form>
        <ol className="text-xs text-neutral-500 font-mono space-y-1">
          <li>01 · tinyfish browses the open web</li>
          <li>02 · nexla structures the data</li>
          <li>03 · redis cross-references claims</li>
          <li>04 · ghost publishes the report</li>
          <li>05 · x402 unlocks the deep file</li>
        </ol>
      </div>
    </section>
  );
}
