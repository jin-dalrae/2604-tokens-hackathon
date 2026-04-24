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
    <section className="nn-landing-bg flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-3xl w-full flex flex-col items-center text-center gap-10">
        <span className="nn-chip">Synthetic Intelligence · Live</span>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
          The web researches itself.
          <br />
          <span className="nn-gradient-text">The web cites itself.</span>
          <br />
          You get paid.
        </h1>

        <p className="text-[var(--on-surface-variant)] text-base max-w-xl leading-relaxed">
          SuperBrain drives a headless browser across the open web, cross-references official claims
          against public signal, and publishes a cited, federated, monetizable intelligence report
          in under a minute.
        </p>

        <form onSubmit={submit} className="flex w-full max-w-xl gap-3 items-stretch">
          <input
            className="nn-input flex-1 text-lg"
            placeholder="Company name — e.g. Stripe, Anthropic, Vercel"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={busy}
            autoFocus
          />
          <button
            type="submit"
            disabled={busy || !company.trim()}
            className="nn-btn-primary min-w-[140px] flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[var(--on-primary)] nn-pulse" />
                Running
              </>
            ) : (
              <>Launch Agent →</>
            )}
          </button>
        </form>

        <ol className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
          {STEPS.map((s, i) => (
            <li key={s} className="nn-card px-4 py-3 flex items-start gap-3">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--primary)] pt-0.5">
                0{i + 1}
              </span>
              <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--on-surface-variant)]">
                {s}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const STEPS = [
  "Browse · TinyFish",
  "Memory · Redis",
  "Publish · Ghost",
  "Cite · Senso",
  "Federate · Wundergraph",
  "Monetize · x402 + CDP",
];
