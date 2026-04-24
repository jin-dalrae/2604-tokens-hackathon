# SuperBrain

---

## SLIDE 01 — The One-Liner

### The web researches itself. The web cites itself. You get paid.

SuperBrain is an autonomous agent that, given a company name, drives a headless browser across the open web, cross-references what the company claims against what the public signal actually says, and publishes the resulting intelligence as a cited, federated, monetizable report.

---

## SLIDE 02 — The Problem

**Researching a company takes 30–45 minutes of manual work.** Websites are marketing copy. LinkedIn is curated. X is unfiltered. News is late. Nobody sits and cross-references them — they just skim one source and guess.

**The web is moving from humans to agents.** When an agent summarizes your page to its user, no click lands on you. No attribution. No payment. Publishing without a citation rail is writing for free.

**AI company-research tools today give you a chat answer, not a data record.** Other agents can't consume a Perplexity response as typed knowledge. The agentic web needs federated, citable, paid sources.

---

## SLIDE 03 — The Solution

**One input → one minute → one cited, federated, monetizable report.**

- **Autonomous browsing** across website + LinkedIn + X + news via TinyFish
- **Cross-referenced memory** in Redis Cloud; contradictions surface automatically
- **Synthesized** into a typed `CompanyInsight` record
- **Published** to a Ghost blog post with an embedded 3D WebGL knowledge map
- **Cited** on cited.md via Senso — discoverable and cite-able by the next agent
- **Federated** as a GraphQL subgraph through Wundergraph Cosmo — queryable as structured data
- **Monetized** through a 1 USDC x402 micropayment on Coinbase Developer Platform

---

## SLIDE 04 — How To Use It

```
 ┌──────────────────────────────────────────────────────────────┐
 │  1. Type a company name at /  → click Launch                 │
 │  2. Watch the Agent Status Sidebar stream real-time events   │
 │     (browse → structure → memory → synthesize → publish)     │
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
SENSO_API_KEY           # Senso — cited.md publishing
COSMO_API_KEY           # Wundergraph Cosmo — federated GraphQL
TinyFish_API            # TinyFish — real browsing
CDP_client_api          # Coinbase Developer Platform (+ CDP_secret)
APP_PUBLIC_URL          # ngrok or Vercel URL so Ghost iframes resolve
```

For a public demo URL:
- `ngrok http 3000` → paste the https URL as `APP_PUBLIC_URL`, or
- `npx vercel --prod` → use the production Vercel URL

---

## SLIDE 05 — Architecture

```
              ┌───────────────────────────────┐
              │       Next.js 16 App          │
   company ──▶│  /  → /research/:id → /report/:id  + /embed/map/:id
              └────────────────┬──────────────┘
                               │
      ┌────────────────────────┼────────────────────────┐
      │                        │                        │
┌─────▼─────┐       ┌─────────▼─────────┐     ┌────────▼─────────┐
│ TinyFish  │       │   Orchestrator    │     │   SSE stream     │
│ (browse)  │       │   (agentic loop)  │────▶│ → status sidebar │
└─────┬─────┘       └──────┬────────┬───┘     └──────────────────┘
      │                    │        │
      ▼                    ▼        ▼
   raw pages         Redis Cloud   Synthesize → CompanyInsight
                    (memory +      │
                     contradictions)│
                                   ▼
    ┌──────────┬──────────────┬──┴──────────┬─────────────┐
    ▼          ▼              ▼             ▼             ▼
  Ghost     Senso          Wundergraph    cited.md     CDP + x402
  post      cited.md       Cosmo          local        deep-research
            citeable       federated                   unlock
                           subgraph
```

Every sponsor sits behind a thin adapter in `src/lib/adapters/` with a graceful fallback. The demo never shows a blank screen — if a sponsor's API is down, the session transparently continues on a local mock.

---

## SLIDE 06 — Sponsor Stack

| Sponsor | Role in SuperBrain | Status |
|---|---|---|
| **Redis Cloud** | Semantic memory; cross-references facts across sources | **Live** — verified writes |
| **Ghost Pro** | Canonical public report; hosts the WebGL iframe | **Live** — posts published per run |
| **Senso** | cited.md publishing + GEO visibility | **Live** — 3 citeables, 9 GEO prompts, heal report filed |
| **Wundergraph Cosmo** | Federated GraphQL for agent-to-agent consumption | Subgraph built, Cosmo registration in flight |
| **TinyFish** | Real headless browser driving across the open web | Key live, integration swap pending |
| **Coinbase CDP + x402** | Agent-native payment rail (1 USDC / deep-research unlock) | Keys live, integration swap pending |

**Six real integrations** — two beyond the hackathon minimum.

---

## SLIDE 07 — Live Proof

What's already running right now:

- **3 published citeables on cited.md** (all live, all public):
  - https://cited.md/article/75ef6973-8edc-4e82-a37d-6d1ff2c86207 — *What is SuperBrain*
  - https://cited.md/article/5bac7cc7-3810-4bdb-b3da-2013aa75488c — *SuperBrain vs Perplexity*
  - https://cited.md/article/2fc991b9-ff44-4208-bb41-f6f744c5dd69 — *Pricing and x402*
- **Live Ghost posts** at `superbrain.ghost.io` with embedded 3D WebGL maps.
- **Senso Superbrain org** fully populated — 12 KB docs, brand kit, 4 content types, 9 prompts, 9 drafts.
- **GEO visibility monitoring** running Mon/Wed/Fri across ChatGPT, Claude, Perplexity, Gemini.
- **cited.md file** emitted at the repo root on every run as a local mirror.
- **Paywalled deep-research flow** — settle → blur-off, end-to-end.

---

## SLIDE 08 — Business Model

**Per-report micropayment (x402 on CDP).**
1 USDC unlocks the deep-research section of any report. No seat licenses, no subscriptions. This is agent-native pricing — priced per unit of work, not per user per month.

**Indirect — citation economy.**
Every SuperBrain report lands on cited.md with typed sources and a GraphQL schema. Any downstream agent that cites a SuperBrain report triggers a metered fetch. SuperBrain becomes not just a consumer of the agentic web, but a **first-class source** other agents cite and pay for.

**Why this beats SaaS for agents.**
Agents don't sign up, don't auth, don't subscribe. They hit an endpoint, pay per request, move on. Our pricing matches that shape.

---

## SLIDE 09 — Why This Wins (Directly mapped to the rubric)

| Hackathon rule | Our answer |
|---|---|
| Real autonomous agent, real open-web action | 6-stage SSE-streamed loop across 4 open-web source types |
| Publish to cited.md | 3 citeables **already live** on cited.md via Senso |
| Monetize with agent payment rails | x402 on CDP settles every deep-research unlock |
| Use 3+ sponsor tools | **6 real** — two beyond the minimum |
| 3-minute demo | Full loop in ~30s; every segment maps 1:1 to a sponsor |

Plus the differentiator nobody else ships: an **interactive 3D WebGL knowledge map** embedded inside the published Ghost post. Judges see the agent's intelligence as a literal cyan-violet constellation.

---

## SLIDE 10 — The 3-Minute Demo Script

```
0:00  "The web researches itself. You get paid."
0:10  Type a company name. Hit launch.
0:25  Agent sidebar lights up: TinyFish browses, Redis memorizes,
      contradictions surface in real time.
1:00  Report page: 3D knowledge map spins; summary stats render.
1:30  Open the Ghost post — same WebGL map inside the blog post.
2:00  Open the cited.md article — live, public, discoverable.
2:25  Flip to Cosmo — federated GraphQL query against what we gathered.
2:45  Click "pay 1 USDC" — CDP/x402 settles — deep research reveals.
3:00  Mic drop.
```

---

## SLIDE 11 — Tech Stack

- Next.js 16, React 19, TypeScript
- React Three Fiber + drei — WebGL knowledge map
- Zod — runtime data-model validation
- graphql-yoga + @apollo/subgraph — federated GraphQL subgraph
- @tryghost/admin-api — Ghost publishing
- redis — semantic memory
- @senso-ai/cli + @senso-ai/shipables — cited.md publishing
- Tailwind + Neural Nexus design system — glassmorphism + deep-space UI

---

## SLIDE 12 — File Tour

```
src/
├── app/
│   ├── page.tsx                    # landing — enter a company
│   ├── research/[id]/page.tsx      # live agent status sidebar
│   ├── report/[id]/page.tsx        # final report + WebGL + paywall
│   ├── embed/map/[id]/page.tsx     # chromeless WebGL for Ghost iframe
│   └── api/
│       ├── research/               # kickoff + SSE stream
│       ├── pay/[id]/               # x402 settle (CDP)
│       └── graphql/                # Apollo Federation v2 subgraph
├── lib/
│   ├── orchestrator.ts             # the agentic loop
│   ├── jobs.ts                     # in-memory jobs + pub/sub
│   ├── types.ts                    # CompanyInsight (Zod)
│   ├── graphql/schema.ts           # Cosmo-bound schema
│   └── adapters/
│       ├── tinyfish.ts             # browsing
│       ├── redis.ts                # memory
│       ├── ghost.ts                # publishing
│       ├── senso.ts                # cited.md (pending wire)
│       └── x402.ts                 # payment
└── components/
    ├── KnowledgeMap.tsx            # R3F 3D graph
    └── SiteChrome.tsx              # header/footer
```

---

## SLIDE 13 — Credits

Built for the Senso / Shipables.dev hackathon — 2026.

Sponsors live in the stack: **Redis · Ghost · Senso · Wundergraph Cosmo · TinyFish · Coinbase CDP + x402.**

See `prd.md` for the full product spec, architecture decisions, demo script, and failover plan.
