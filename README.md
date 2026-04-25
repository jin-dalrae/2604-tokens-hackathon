# SuperBrain

> **The web researches itself. The web cites itself. You get paid.**

An autonomous browser agent that, given a company name, drives a headless browser across the open web, cross-references official claims against public signal, synthesizes the result with an LLM, and publishes the resulting intelligence as a cited, federated, monetizable report — all in under a minute.

**Live surfaces**

| | |
|---|---|
| Public reports | https://superbrain.ghost.io |
| Sample citeable | https://cited.md/article/c7e8abb0-1c2e-4dc0-9ee1-4b3701e4ae45 |
| Federated graph | Wundergraph Cosmo · `superbrain` / `superbrain-intel` |
| Source | https://github.com/jin-dalrae/2604-tokens-hackathon |

**Stack at a glance** — Next.js 16 · React 19 · TypeScript · React Three Fiber · Gemini · Apollo Federation v2

**Sponsors live in production** — Redis Cloud · Ghost Pro · Senso · Wundergraph Cosmo · TinyFish · Coinbase CDP + x402 · Google Gemini

---

## Table of contents

- [Inspiration](#inspiration)
- [What it does](#what-it-does)
- [How we built it](#how-we-built-it)
- [Challenges we ran into](#challenges-we-ran-into)
- [Accomplishments we're proud of](#accomplishments-were-proud-of)
- [What we learned](#what-we-learned)
- [What's next for SuperBrain](#whats-next-for-superbrain)
- [Architecture](#architecture)
- [Sponsor stack](#sponsor-stack)
- [3-minute demo script](#3-minute-demo-script)
- [Run it](#run-it)
- [File tour](#file-tour)
- [Credits](#credits)

---

## Inspiration

The web is shifting from humans to agents — and publishing without a citation rail is writing for free. When ChatGPT summarizes your page to a user, no click lands on you. No attribution. No payment.

Meanwhile, existing AI research tools hand you a chat answer when what other agents actually need is a typed data record. Senso's `cited.md` manifesto — *every fetch by every agent is a transaction* — and Karpathy's compounding-knowledge thesis gave us the thread: build a node in that new agent-native web, not another SaaS dashboard on top of the old one.

## What it does

You type a company name. In under a minute, SuperBrain:

1. Dispatches **4 parallel TinyFish browse agents** across the company website, LinkedIn, X search, and Google News
2. Writes every extracted fact to **Redis Cloud** as semantic memory and flags contradictions between sources
3. Retrieves grounded context from our curated **Senso knowledge base**
4. Hands the raw pages + KB context to **Gemini** (`gemini-3.1-flash-lite-preview`) to synthesize a typed `CompanyInsight` with real named people, real competitors, and URL-cited contradictions
5. Publishes a free-tier post to **Ghost Pro** with an interactive 3D WebGL knowledge map embedded inline
6. Publishes a full citeable to **cited.md** via **Senso** so downstream agents can cite and micro-pay us for the fetch
7. Exposes the knowledge as a federated GraphQL subgraph through **Wundergraph Cosmo**
8. Gates the deep-research section (contradictions, key people, full sources) behind a **1 USDC x402** payment settled by a **Coinbase Developer Platform** facilitator

The agent narrates itself in a live SSE sidebar the whole time. The report is simultaneously a Ghost article, a cited.md citeable, a GraphQL subgraph, and a paywalled dashboard — **one record, four surfaces**.

## How we built it

- **Next.js 16 (App Router) + React 19 + TypeScript** for the full-stack app
- **React Three Fiber + drei** for the 3D knowledge map, embedded in Ghost posts via a chromeless `/embed/map/:id` iframe
- **Adapter pattern** for every sponsor (`src/lib/adapters/*.ts`) — each adapter has a real integration plus a graceful in-process fallback, so the orchestrator never knows whether it's talking to the real cloud or a mock
- **Server-Sent Events** for live agent status streaming into the sidebar
- **Apollo Federation v2 subgraph** served by a direct `graphql-js` executor at `/api/graphql`, then registered with `wgc` and composed into the Cosmo federated graph `superbrain`
- **Gemini's structured JSON output** with a strict schema + "every contradiction must cite a URL from the inputs" prompt rule, so the LLM can't hallucinate people or sources
- **Senso onboarding skill** installed via Shipables, then run end-to-end: 7 folders, brand kit, 4 content types, 12 KB docs, 9 prompts, 3 live citeables, GEO monitoring on Mon/Wed/Fri
- **`x402-next`'s `withX402` wrapper** + `@coinbase/x402` facilitator for the real payment rail
- **Neural Nexus design system** — cyan/violet glassmorphism, Inter + Space Grotesk, glow states — applied end-to-end with a brain-shaped landing background
- Deployed as a single Next.js app with **graceful fallbacks everywhere** — if any sponsor is down mid-demo, the loop continues on local mocks and we never blank-screen on stage

## Challenges we ran into

- **Senso's public docs point at the wrong base URL.** `sdk.senso.ai` returns 404s for writes. We decompiled the CLI's bundled JS to find the real endpoint (`apiv2.senso.ai/api/v1/org/content-engine/publish`) and the real auth header.
- **TinyFish's sync `/run` endpoint blocks for 30–60 seconds per URL.** Four sequential calls would blow the 3-minute demo budget. We parallelized them and tightened the per-call timeout to 25 seconds, so worst case 1–2 of 4 cleanly fall back to mocks.
- **JSX `<line>` resolves to the SVG `<line>` element, not `THREE.Line`.** The knowledge map's edges literally weren't rendering. Swapped to stretched cylinder meshes — unambiguous and visually thicker, with opacity driven by edge strength.
- **`engine publish` returned "content linkage conflict"** when a draft already existed for a prompt. Solved with delete-then-publish-fresh in our adapter.
- **Type mismatch between `@coinbase/x402` and `x402/types`** — both ship a `FacilitatorConfig` that's structurally compatible but not type-assignable. One `as unknown as` cast at the boundary.
- **Nexla's account was empty and flow setup didn't fit the weekend.** Rather than ship a broken claim, we silently dropped Nexla from every user-facing surface and added a replacement in the narrative.
- **Keeping 7 sponsor credentials coordinated** without leaking any of them into git. `.env` is gitignored; pre-commit secret scans ran on every staged diff.

## Accomplishments we're proud of

- **Seven real sponsor integrations in a weekend**, not four real and three mocked — Redis, Ghost, Senso, Wundergraph Cosmo, TinyFish, CDP + x402, and Gemini all talking to real clouds.
- **Gemini returns real, correct facts.** On a "Notion" test run, unprompted, it named Ivan Zhao, Simon Last, and Akshay Kothari as founders and listed Atlassian (Confluence/Jira), Microsoft Loop, Obsidian, and Coda as competitors — every one accurate, none hallucinated.
- **Every run ships all three publishing targets simultaneously** — a live Ghost post with a spinning 3D WebGL map, a cited.md citeable, and a federated GraphQL record. One record, four surfaces.
- **Graceful-fallback adapter mesh** — every sponsor can fail and the demo keeps running.
- **Cosmo federated graph live and composable**, with our subgraph published and checked.
- **Neural Nexus design system applied end-to-end** — landing, agent status, report, embed — with glassmorphism, glow states, and a brain-shaped background.
- **Full loop in ~35 seconds** with all real clouds firing.

## What we learned

- **LLM structured-JSON output with schema + "cite-from-inputs" rules produces usable data.** Gemini didn't hallucinate once across our test runs because the system prompt required URLs from the provided pages for every contradiction.
- **Parallelism plus strict timeouts is a demo-safety pattern, not a hack.** 4 × 60s sequential would have been 4 minutes. 4 × 25s parallel is 25 seconds worst case.
- **Adapter pattern pays for itself at 3+ sponsors.** Swapping mock to real, or real to fallback, should be one file and no touch to the orchestrator.
- **The agentic web's pricing model is genuinely different.** Per-seat SaaS assumes users; agents don't sign up. Per-request micropayment matches the unit of work.
- **"Graceful fallback" is a feature, not a crutch** — it's what separates a demo that ships from one that breaks.
- **Decompile the CLI when the docs lie.** Twice this weekend, reading `node_modules/.../dist/cli.js` unblocked what the public docs left vague.

## What's next for SuperBrain

- **Autonomous decision loop.** Today the orchestrator is a fixed 6-step pipeline. Next: Claude or Gemini decides what to browse next based on what's already found ("the website claims X but LinkedIn is thin — check Crunchbase and the founder's X feed").
- **TinyFish `/run-async` with streaming.** Today we use the sync endpoint and cap at 25s. Async + SSE polling lets us wait longer for richer extraction without a cold demo budget.
- **Real on-chain settlement on base mainnet.** CDP facilitator is wired; we need a real CDP-controlled wallet and the end-to-end x402 client flow on a live invoice.
- **MCP server wrapper.** Expose SuperBrain as a tool Claude, Cursor, and Codex can invoke natively — *"run SuperBrain on Anthropic, ground it, and cite it back."*
- **Cross-subgraph federation.** Combine our `superbrain` subgraph with public subgraphs (people data, funding data, SEC filings) so downstream agents query one unified GraphQL supergraph.
- **Scheduled re-runs.** Track a company, receive a diff report when something material changes (new CRO, sentiment flip, contradiction resolves).
- **GEO feedback loop.** Use Senso's scheduled GEO probes across ChatGPT/Claude/Perplexity/Gemini to see where our published citeables are winning and losing, then tune the prompts + KB automatically. The compounding flywheel Karpathy described — but for a company, not a person.

---

## Architecture

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

Every sponsor sits behind a thin adapter in `src/lib/adapters/` with a graceful fallback. Gemini down? Template synth. Senso down? Local `cited.md` still writes. **The demo never shows a blank screen.**

## Sponsor stack

| Sponsor | Role | Status |
|---|---|---|
| **Redis Cloud** | Semantic memory · contradiction cross-reference | Live — verified writes |
| **Ghost Pro** | Canonical public report · WebGL iframe host | Live — posts published per run at `superbrain.ghost.io` |
| **Senso** | cited.md per-run publish · KB grounding · GEO visibility | Live — 3+ citeables live, grounding every synth |
| **Wundergraph Cosmo** | Federated GraphQL supergraph | Live — subgraph composed in federated graph `superbrain` |
| **TinyFish** | 4 parallel headless browser agents | Live — `/v1/automation/run` per target |
| **Coinbase CDP + x402** | Agent-native micropayment rail (1 USDC / unlock) | Live — CDP facilitator wired |
| **Gemini (Google)** | LLM synthesis — real reasoning over pages + KB | Live — `gemini-3.1-flash-lite-preview` |

**Seven real integrations.** Four beyond the hackathon minimum.

## 3-minute demo script

```
0:00  "The web researches itself. You get paid."
0:10  Type a company name. Hit launch.
0:25  Agent sidebar lights up: 4 TinyFish agents browse in parallel,
      Redis memorizes, Senso KB grounds, Gemini reasons.
1:00  Report: 3D knowledge map spins with real people and real
      competitors on it.
1:30  Open Ghost post — same 3D map embedded inside the blog post.
2:00  Open the cited.md article — live, public, discoverable.
2:25  Flip to Cosmo — federated GraphQL query against the knowledge.
2:45  Click "pay 1 USDC" — CDP/x402 settles — deep research reveals.
3:00  "We browse. We structure. We cite. We get paid."
```

Each segment maps 1:1 to a sponsor. No theatrics. No staging.

## Run it

### Local development

```bash
npm install
npm run dev
# open http://localhost:3000
```

Zero credentials? The app runs against in-process mocks — every sponsor degrades gracefully. It never shows a blank screen.

### With real sponsors (recommended)

Fill in `.env` (see `.env.example`):

```env
REDIS_URL               # Redis Cloud — semantic memory
ghost_admin_api         # Ghost Pro — publishing
ghost_url               # https://yourname.ghost.io
SENSO_API_KEY           # Senso — cited.md publishing + KB search
COSMO_API_KEY           # Wundergraph Cosmo — federated GraphQL
TinyFish_API            # TinyFish — real browsing
CDP_client_api          # Coinbase Developer Platform
CDP_secret              # CDP secret
GEMINI_API_KEY          # Google Gemini — synthesis reasoning
AI_MODEL                # e.g. gemini-3.1-flash-lite-preview
APP_PUBLIC_URL          # ngrok or Vercel URL so Ghost iframes resolve
```

### Public deploy

This app **cannot run on GitHub Pages** — it needs a Node runtime for SSE streaming, server-side API routes, Redis, Gemini, the CDP facilitator, and Ghost / Senso publishing.

The fastest path:

```bash
npx vercel --prod
```

Then set the same `.env` vars in the Vercel dashboard, and update `APP_PUBLIC_URL` to your Vercel URL so the Ghost-embedded iframe resolves from anywhere.

For local-only public demos: `ngrok http 3000` and paste the https URL into `APP_PUBLIC_URL`.

## File tour

```
src/
├── app/
│   ├── page.tsx                       # landing — hero, agents, cited.md, money flow
│   ├── research/[id]/page.tsx         # live agent status sidebar
│   ├── report/[id]/page.tsx           # final report + WebGL + paywall
│   ├── reports/page.tsx               # index of all past runs
│   ├── embed/map/[id]/page.tsx        # chromeless WebGL for Ghost iframe
│   └── api/
│       ├── research/                  # kickoff + SSE stream
│       ├── reports/                   # list of past jobs
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
│       ├── redis.ts                   # memory + contradictions
│       ├── ghost.ts                   # Ghost publish (free tier only)
│       ├── senso.ts                   # cited.md per-run publish
│       ├── senso-search.ts            # KB grounding search
│       ├── gemini.ts                  # LLM synthesis
│       └── x402.ts                    # CDP facilitator
└── components/
    ├── KnowledgeMap.tsx               # R3F 3D graph
    └── SiteChrome.tsx                 # header / footer
```

## Credits

Built for the **Senso / Shipables.dev hackathon**, 2026.

Seven sponsors live in the stack: **Redis · Ghost · Senso · Wundergraph Cosmo · TinyFish · Coinbase CDP + x402 · Gemini.**

See [`prd.md`](./prd.md) for the full product spec, architecture decisions, and demo script.
