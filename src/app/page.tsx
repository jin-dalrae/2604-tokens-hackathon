"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <div className="flex-1">
      <Hero />
      <HowItWorks />
      <Innovation />
      <Monetization />
      <ClosingCTA />
    </div>
  );
}

/* ============================ HERO ============================ */

function Hero() {
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
    <section className="nn-landing-bg px-6 pt-24 pb-28 flex flex-col items-center text-center">
      <div className="max-w-3xl w-full flex flex-col items-center gap-10">
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

/* ============================ HOW IT WORKS ============================ */

function HowItWorks() {
  return (
    <section className="relative px-6 py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto space-y-12">
        <SectionHeader
          eyebrow="How it works"
          title={<>One input. <span className="nn-gradient-text">Five agents.</span> Four live sources. Sixty seconds.</>}
          body="Every launch dispatches real autonomous work across the web. These are the agents you see streaming in the sidebar."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Agents at work" tint="primary">
            <AgentRow
              name="SuperBrain orchestrator"
              where="Next.js server"
              kind="conductor"
              desc="Dispatches the loop, streams SSE events, holds graceful fallbacks."
            />
            <AgentRow
              name="TinyFish browse agents ×4"
              where="TinyFish cloud · /v1/automation/run"
              kind="LLM · web"
              desc="Four parallel agents open a URL, follow a prose goal, return typed data."
            />
            <AgentRow
              name="Senso content engine"
              where="Senso cloud"
              kind="LLM · content"
              desc="Takes KB + prompts, produces brand-aligned drafts, publishes to cited.md."
            />
            <AgentRow
              name="Senso GEO monitor"
              where="Senso cloud · Mon/Wed/Fri"
              kind="scheduled"
              desc="Probes ChatGPT, Claude, Perplexity, Gemini with our 9 tracking prompts."
            />
            <AgentRow
              name="Wundergraph Cosmo router"
              where="Cosmo cloud"
              kind="federation"
              desc="Composes our subgraph with others; serves knowledge as queryable GraphQL."
            />
          </Card>

          <Card title="Sources per run" tint="secondary">
            <SourceRow
              kind="website"
              url="{slug}.com"
              goal="Mission, product descriptions, claims about customers and scale"
            />
            <SourceRow
              kind="linkedin"
              url="linkedin.com/company/{slug}"
              goal="Headcount, 30-day growth, top hiring functions, leadership changes"
            />
            <SourceRow
              kind="x"
              url="x.com/search?q={company}"
              goal="Public mentions · sentiment · complaints · competitor overlap"
            />
            <SourceRow
              kind="news"
              url="news.google.com/search?q={company}"
              goal="Five most recent headlines with publication date and summary"
            />
            <div className="pt-2 mt-2 border-t border-white/5 text-xs text-[var(--on-surface-variant)]">
              <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[var(--primary)]">
                + senso kb
              </span>{" "}
              — 12 curated docs about SuperBrain ground every cited.md publish.
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ============================ INNOVATION ============================ */

function Innovation() {
  return (
    <section className="relative px-6 py-24 border-t border-white/5">
      <div className="absolute inset-0 opacity-40 pointer-events-none nn-grid" aria-hidden />
      <div className="max-w-6xl mx-auto space-y-12 relative">
        <SectionHeader
          eyebrow="What's new"
          title={<>Built for the agentic web, <span className="nn-gradient-text">not retrofitted.</span></>}
          body="The web is moving from humans to agents. The tooling hasn't caught up. SuperBrain is five things existing products aren't."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Innov
            title="Cross-source, not single-source."
            body="Perplexity summarizes what sources say. We tell you where they disagree — every contradiction between official claims and public signal is surfaced as a first-class field, with both citations attached."
          />
          <Innov
            title="Typed data, not chat."
            body="Other agents can't consume a chat answer. Every report is a typed CompanyInsight record — published as cited.md, exposed via federated GraphQL, queryable as structured knowledge."
          />
          <Innov
            title="Agent-native pricing."
            body="No seat licenses. No subscriptions. 1 USDC on base-sepolia via x402 + Coinbase CDP per deep-research unlock. Priced per unit of work, the way an agent actually transacts."
          />
          <Innov
            title="Published to cited.md — a source, not just a consumer."
            body="Every run lands as a citeable at cited.md/article/&lt;id&gt;. Downstream agents cite our work and trigger fetch-metered micropayments back. SuperBrain is a node in the citation economy."
          />
          <Innov
            title="Federated via Wundergraph Cosmo."
            body="Our subgraph is composable. Any other agent system can merge SuperBrain knowledge into its own GraphQL supergraph without coupling or scraping."
          />
          <Innov
            title="Graceful fallback everywhere."
            body="Every sponsor sits behind an adapter with a working mock. If a service fails on stage, the demo keeps running on local fallbacks. We never blank-screen a judge."
          />
        </div>
      </div>
    </section>
  );
}

/* ============================ MONETIZATION ============================ */

function Monetization() {
  return (
    <section className="relative px-6 py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto space-y-12">
        <SectionHeader
          eyebrow="Money flow"
          title={<>Free to find. <span className="nn-gradient-text">Paid to unlock.</span> Royalties when cited.</>}
          body="Two revenue paths, matching the two audiences — humans who discover on Ghost, and agents that cite on cited.md."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <MoneyStream
            index="01"
            where="Ghost post"
            tint="primary"
            role="Distribution · Free"
            detail="Public marketing page. Summary + stats + 3D map + a CTA to unlock the full report. No paywall here — Ghost's job is reach."
          />
          <MoneyStream
            index="02"
            where="/report/:id"
            tint="secondary"
            role="1 USDC · direct unlock"
            detail="Deep research — contradictions, key people, full competitors, full sources — gated by x402 + Coinbase CDP on base-sepolia. Pay-per-report."
          />
          <MoneyStream
            index="03"
            where="cited.md/article/:id"
            tint="primary"
            role="Citation royalties"
            detail="Every agent that cites our cited.md entry triggers a Senso-metered fetch. We become a source in the agent economy."
          />
        </div>

        <div className="nn-card nn-card-lg p-6 flex flex-col sm:flex-row gap-6 items-center">
          <div className="flex-1 space-y-2">
            <div className="nn-label">Why this works</div>
            <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
              Agents don&apos;t sign up. They hit an endpoint, pay per request, move on. Seat
              licensing is the wrong unit for the agentic web. We price per unit of work — which is
              what the work actually is.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="nn-chip">no subscription</span>
            <span className="nn-chip">no seat license</span>
            <span className="nn-chip">on-chain settlement</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ CLOSING CTA ============================ */

function ClosingCTA() {
  return (
    <section className="px-6 py-20 border-t border-white/5">
      <div className="max-w-3xl mx-auto text-center space-y-5">
        <h3 className="text-3xl font-bold tracking-tight">
          Run it yourself.{" "}
          <span className="nn-gradient-text">One input.</span> One minute.
        </h3>
        <p className="text-[var(--on-surface-variant)] text-sm max-w-xl mx-auto">
          Scroll back to the top and type a company. You&apos;ll watch TinyFish browse, Redis
          remember, contradictions surface, and a cited.md entry land on the open web.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <a href="#top" className="nn-btn-primary">Back to top ↑</a>
          <a
            href="https://cited.md"
            target="_blank"
            rel="noopener noreferrer"
            className="nn-btn-ghost"
          >
            Visit cited.md ↗
          </a>
        </div>
      </div>
    </section>
  );
}

/* ============================ PRIMITIVES ============================ */

function SectionHeader({
  eyebrow, title, body,
}: { eyebrow: string; title: React.ReactNode; body: string }) {
  return (
    <div className="max-w-3xl space-y-3">
      <span className="nn-label">{eyebrow}</span>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{title}</h2>
      <p className="text-[var(--on-surface-variant)] leading-relaxed">{body}</p>
    </div>
  );
}

function Card({
  title, tint, children,
}: { title: string; tint: "primary" | "secondary"; children: React.ReactNode }) {
  const accent = tint === "primary" ? "var(--primary)" : "var(--secondary)";
  return (
    <div
      className="nn-card nn-card-lg p-6 space-y-3 border-l-2"
      style={{ borderLeftColor: accent }}
    >
      <div className="nn-label">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AgentRow({
  name, where, kind, desc,
}: { name: string; where: string; kind: string; desc: string }) {
  return (
    <div className="group flex gap-4 items-start py-2 border-b border-white/5 last:border-b-0">
      <span
        aria-hidden
        className="w-1.5 h-1.5 rounded-full mt-2 nn-pulse"
        style={{ background: "var(--accent-grad)" }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-semibold text-sm">{name}</span>
          <span className="nn-chip">{kind}</span>
        </div>
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--on-surface-variant)]/70 mt-0.5">
          {where}
        </div>
        <p className="text-xs text-[var(--on-surface-variant)] mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function SourceRow({
  kind, url, goal,
}: { kind: string; url: string; goal: string }) {
  return (
    <div className="py-2 border-b border-white/5 last:border-b-0 space-y-1">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--primary-soft)]">
          [{kind}]
        </span>
        <span className="font-mono text-[11px] text-[var(--on-surface-variant)] truncate">{url}</span>
      </div>
      <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">{goal}</p>
    </div>
  );
}

function Innov({ title, body }: { title: string; body: string }) {
  return (
    <div className="nn-card p-5 space-y-2">
      <h3 className="font-semibold text-base tracking-tight">{title}</h3>
      <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">{body}</p>
    </div>
  );
}

function MoneyStream({
  index, where, tint, role, detail,
}: { index: string; where: string; tint: "primary" | "secondary"; role: string; detail: string }) {
  const accent = tint === "primary" ? "var(--primary)" : "var(--secondary)";
  return (
    <div
      className="nn-card nn-card-lg p-6 space-y-3 relative overflow-hidden"
      style={{ boxShadow: `inset 2px 0 0 ${accent}` }}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--primary)]">
          {index}
        </span>
        <span className="nn-chip">{role}</span>
      </div>
      <div className="text-lg font-semibold">{where}</div>
      <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">{detail}</p>
    </div>
  );
}
