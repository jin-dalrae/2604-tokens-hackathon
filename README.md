# SuperBrain

---

## SLIDE 01 — The One-Liner

### The web researches itself. The web cites itself. You get paid.

SuperBrain is an autonomous agent that, given a company name, drives a headless browser across the open web, cross-references what the company claims against what public signal actually says, and publishes the resulting intelligence as a cited, federated, monetizable report — synthesized by a real LLM in under a minute.

---

## SLIDE 02 — The Problem

**Researching a company takes 30–45 minutes of manual work.** Websites are marketing copy. LinkedIn is curated. X is unfiltered. News is late. Nobody sits and cross-references them — they just skim one source and guess.

**The web is moving from humans to agents.** When an agent summarizes your page to its user, no click lands on you. No attribution. No payment. Publishing without a citation rail is writing for free.

**AI company-research tools today give you a chat answer, not a data record.** Other agents can't consume a Perplexity response as typed knowledge. The agentic web needs federated, citable, paid sources.

---

## SLIDE 03 — The Solution

**One input → one minute → one cited, federated, monetizable report.**

- **Autonomous browsing** across website + LinkedIn + X + news via **TinyFish** (4 parallel browse agents per run)
- **Cross-referenced memory** in **Redis Cloud**; contradictions surface automatically
- **Grounded** in our curated **Senso** knowledge base (12 docs + live search)
- **Synthesized** by **Gemini** — real LLM reasoning over raw pages + KB context; returns typed, structured data (real named people, real competitors, real contradictions with URL citations)
- **Published** to a **Ghost** blog post with an embedded 3D WebGL knowledge map
- **Cited** on **cited.md** via Senso — discoverable and cite-able by the next agent
- **Federated** as a GraphQL subgraph through **Wundergraph Cosmo** — any other agent can query it
- **Monetized** through a 1 USDC **x402** micropayment settled on **Coinbase Developer Platform**

---

## SLIDE 04 — How To Use It

```
 ┌──────────────────────────────────────────────────────────────┐
 │  1. Type a company name at /  → click Launch                 │
 │  2. Watch the Agent Status Sidebar stream real-time events   │
 │     (TinyFish → Redis → Senso KB → Gemini → publish)         │
 │  3. Report page opens with summary + 3D knowledge map        │
 │  4. Open the Ghost post — WebGL map is inside the blog post  │
 │  5. Open the cited.md article — your citation is live        │
 │  6. Query the GraphQL endpoint — agents consume the record   │
 │  7. Click "Pay 1 USDC" → x402/CDP settles → deep research    │
 │     reveals (contradictions, people, full sources)           │
 └──────────────────────────────────────────────────────────────┘
```

### Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Zero credentials? The app runs against in-process mocks. It never shows a blank screen.

### Run with real sponsors (recommended)

Fill in `.env` (see `.env.example`). Minimum set for the full demo:

```
REDIS_URL               # Redis Cloud — semantic memory
ghost_admin_api         # Ghost Pro — publishing (+ ghost_url)
SENSO_API_KEY           # Senso — cited.md publishing + KB search
COSMO_API_KEY           # Wundergraph Cosmo — federated GraphQL
TinyFish_API            # TinyFish — real browsing
CDP_client_api          # Coinbase Developer Platform (+ CDP_secret)
GEMINI_API_KEY          # Google Gemini — synthesis reasoning
AI_MODEL                # e.g. gemini-3.1-flash-lite-preview
APP_PUBLIC_URL          # ngrok or Vercel URL so Ghost iframes resolve
```

For a public demo URL:
- `ngrok http 3000` → paste the https URL as `APP_PUBLIC_URL`, or
- `npx vercel --prod` → use the production Vercel URL

---

## SLIDE 05 — Architecture

```
              ┌─────────────────────────────────────────────────┐
              │                Next.js 16 App                   │
   company ──▶│  /  → /research/:id → /report/:id  + /embed/map/:id
              └──────────────────────┬──────────────────────────┘
                                     │
  ┌──────────────────────────────────┼──────────────────────────────┐
  │                                  │                              │
┌─▼──────────┐         ┌─────────────▼───────────┐       ┌──────────▼────────┐
│ TinyFish   │         │      Orchestrator       │       │     SSE stream    │
│ (×4 agents)│         │    (agentic loop)       │──────▶│ → status sidebar  │
└─┬──────────┘         └────┬──────────┬─────────┘       └───────────────────┘
  │                         │          │
  ▼                         ▼          ▼
 raw pages              Redis Cloud   Senso KB search
                       (memory +      (grounded context)
                        contradictions)│
                               │      │
                               ▼      ▼
                         ┌────────────────┐
                         │    Gemini      │
                         │ reasons over   │
                         │ everything →   │
                         │ typed          │
                         │ CompanyInsight │
                         └──────┬─────────┘
                                │
   ┌──────────┬────────────┬────┴───────┬─────────────┐
   ▼          ▼            ▼            ▼             ▼
 Ghost     Senso        Wundergraph   cited.md      CDP + x402
 post      cited.md     Cosmo         local         unlock
           citeable     federated                   deep research
                        subgraph
```

Every sponsor sits behind a thin adapter in `src/lib/adapters/` with a graceful fallback. Gemini down? Template synth. Senso down? Local `cited.md` still writes. The demo never shows a blank screen.

---

## SLIDE 06 — Sponsor Stack — Seven Real Integrations

| Sponsor | Role | Status |
|---|---|---|
| **Redis Cloud** | Semantic memory, contradiction cross-reference | Live — verified writes |
| **Ghost Pro** | Canonical public report + WebGL iframe host | Live — posts published at `superbrain.ghost.io` |
| **Senso** | cited.md per-run publish + KB search + GEO | Live — 3+ citeables live, grounding every synth |
| **Wundergraph Cosmo** | Federated GraphQL supergraph | Live — subgraph composed in federated graph `superbrain` |
| **TinyFish** | 4 parallel headless browser agents | Live — `/v1/automation/run` per target |
| **Coinbase CDP + x402** | Agent-native micropayment rail (1 USDC / deep-research unlock) | Live — CDP facilitator wired |
| **Gemini (Google)** | LLM synthesis — real reasoning over pages + KB | Live — `gemini-3.1-flash-lite-preview` |

**Seven real integrations.** Four beyond the hackathon minimum.

---

## SLIDE 07 — Live Proof

What's already running right now:

- **Live Ghost posts per run** at `superbrain.ghost.io`, with 3D WebGL maps embedded.
- **Live cited.md citeables per run** at `cited.md/article/:id`, grounded in the Senso KB.
- **Verified Gemini output on "Notion":** returned real founders `Ivan Zhao (CEO)`, `Simon Last`, `Akshay Kothari (COO)` and real competitors `Atlassian`, `Microsoft Loop`, `Obsidian`, `Coda` — unprompted, all correct.
- **Cosmo federated graph** `superbrain` live with subgraph `superbrain-intel` composed.
- **Live GEO visibility monitoring** Mon/Wed/Fri across ChatGPT, Claude, Perplexity, Gemini.
- **End-to-end run under 35 seconds** with all real sponsors firing.
- **Paywalled deep-research flow** — settle → blur-off, end-to-end.

---

## SLIDE 08 — Business Model

**Free to find. Paid to unlock. Royalties when cited.**

### Stream 1 — Ghost (free, marketing)
Public blog post. Summary + stats + 3D map + CTA. Distribution surface. Zero revenue directly.

### Stream 2 — `/report/:id` (1 USDC direct unlock)
The deep-research section — contradictions, key people, full competitor matrix, full source bibliography — gated by **x402** micropayment settled on **Coinbase Developer Platform**. 1 USDC per report. Agent-native pricing.

### Stream 3 — cited.md (citation royalties)
Every agent that cites our cited.md entry triggers a Senso-metered fetch. SuperBrain becomes not just a consumer of the agentic web, but a **first-class source** other agents cite and pay for.

**Why this beats SaaS for agents:** agents don't sign up, don't auth, don't subscribe. They hit an endpoint, pay per request, move on. Our pricing matches the shape of the work.

---

## SLIDE 09 — Why This Wins

| Hackathon rule | Our answer |
|---|---|
| Real autonomous agent, real open-web action | 4 TinyFish agents per run + Gemini reasoning loop |
| Publish to cited.md | Every run publishes a fresh citeable via Senso |
| Monetize with agent payment rails | x402 on CDP — real facilitator wired |
| Use 3+ sponsor tools | **7 real** — Redis, Ghost, Senso, Cosmo, TinyFish, CDP+x402, Gemini |
| 3-minute demo | Full loop in ~35s; every segment maps 1:1 to a sponsor |

And one thing nobody else ships: an **interactive 3D WebGL knowledge map** — rendered with React Three Fiber, auto-rotating, zoomable — embedded *inside* the published Ghost post. Judges see the intelligence as a literal cyan-violet constellation.

---

## SLIDE 10 — The 3-Minute Demo Script

```
0:00  "The web researches itself. You get paid."
0:10  Type a company name. Hit launch.
0:25  Agent sidebar lights up: 4 TinyFish agents browse in parallel,
      Redis memorizes, Senso KB grounds, Gemini reasons.
1:00  Report: 3D knowledge map spins with real people + real
      competitors on it.
1:30  Open Ghost post — same 3D map inside the blog post.
2:00  Open the cited.md article — live, public, discoverable.
2:25  Flip to Cosmo — federated GraphQL query against the knowledge.
2:45  Click "pay 1 USDC" — CDP/x402 settles — deep research reveals.
3:00  "We browse. We structure. We cite. We get paid."
```

---

## SLIDE 11 — Tech Stack

- Next.js 16, React 19, TypeScript
- React Three Fiber + drei — WebGL knowledge map
- Google Gen AI SDK (`@google/genai`) — Gemini synthesis
- Zod — runtime data-model validation
- Apollo Federation v2 + graphql-js — subgraph serving
- @tryghost/admin-api — Ghost publishing
- @coinbase/x402 + x402-next — payment rail
- redis — semantic memory
- @senso-ai/cli + @senso-ai/shipables — cited.md publishing
- Tailwind + Neural Nexus design system — glassmorphism + deep-space UI

---

## SLIDE 12 — File Tour

```
src/
├── app/
│   ├── page.tsx                       # landing (hero + agents + money flow)
│   ├── research/[id]/page.tsx         # live agent status sidebar
│   ├── report/[id]/page.tsx           # final report + WebGL + paywall
│   ├── embed/map/[id]/page.tsx        # chromeless WebGL for Ghost iframe
│   └── api/
│       ├── research/                  # kickoff + SSE stream
│       ├── pay/[id]/                  # demo payment simulator
│       ├── deep/[id]/                 # x402 + CDP protected route
│       └── graphql/                   # Apollo Federation v2 subgraph
├── lib/
│   ├── orchestrator.ts                # the agentic loop
│   ├── jobs.ts                        # in-memory jobs + pub/sub
│   ├── types.ts                       # CompanyInsight (Zod)
│   ├── graphql/schema.ts              # Cosmo-bound schema
│   └── adapters/
│       ├── tinyfish.ts                # real browsing + fallback
│       ├── redis.ts                   # memory
│       ├── ghost.ts                   # Ghost publish (free tier only)
│       ├── senso.ts                   # cited.md per-run publish
│       ├── senso-search.ts            # KB grounding search
│       ├── gemini.ts                  # LLM synthesis
│       └── x402.ts                    # CDP facilitator
└── components/
    ├── KnowledgeMap.tsx               # R3F 3D graph
    └── SiteChrome.tsx                 # header/footer
```

---

## SLIDE 13 — Credits

Built for the Senso / Shipables.dev hackathon — 2026.

Seven sponsors live in the stack: **Redis · Ghost · Senso · Wundergraph Cosmo · TinyFish · Coinbase CDP + x402 · Gemini.**

See `prd.md` for the full product spec, architecture decisions, demo script, and failover plan.
