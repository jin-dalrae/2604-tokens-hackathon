# SuperBrain — Web Intelligence Agent

**Product Requirements Document · v1.0 · final hackathon build**
_Last updated: 2026-04-24_
_Status: shipped_

---

## 1. Vision

SuperBrain is an autonomous web-intelligence agent that, given a company name, drives a headless browser across the open web, cross-references official claims against public signal, synthesizes the result with an LLM, and publishes the resulting intelligence as a cited, federated, monetizable report. Every fetch the agent makes — and every subsequent fetch *by* another agent — is a citation, and a transaction.

## 2. Hackathon alignment

| Requirement | How SuperBrain meets it |
|---|---|
| Autonomous agent doing real action on the open web | 4 parallel TinyFish browse agents per run + a Gemini reasoning loop that produces typed, structured data |
| Publish output to cited.md | Every research run publishes a fresh citeable to `cited.md/article/<id>` via Senso (3+ already live from onboarding) |
| Monetize with agent payment rails | Deep-research section gated by 1 USDC x402 micropayment, settled by a real Coinbase Developer Platform facilitator |
| Use 3+ sponsor tools | **Seven** real integrations: Redis, Ghost, Senso, CDP + x402, Wundergraph Cosmo, TinyFish, Gemini |
| 3-minute demo | Full loop runs in ~35s end-to-end with all sponsors firing |

## 3. Target users

- Job seekers, recruiters, and sales teams who need deep, unbiased, instantly-available company research
- **Other agents** that want typed, federated knowledge they can query and cite

## 4. Core user flow

1. User enters a company name at `/`.
2. Agent runs — the **Agent Status Sidebar** streams SSE events in real time:
   - **Browse** (TinyFish ×4 in parallel) — website, LinkedIn, X search, news
   - **Structure** — parses raw pages into typed facts
   - **Memory + cross-reference** (Redis) — writes facts, flags contradictions
   - **Ground** (Senso KB search) — retrieves curated context that grounds the synthesis
   - **Synthesize** (Gemini) — LLM reasons over raw pages + KB context and produces a structured `CompanyInsight` (real people, real competitors, URL-cited contradictions)
   - **Publish** — Ghost post with WebGL iframe; Senso cited.md citeable; local `cited.md`
   - **Expose** — data is queryable via Wundergraph Cosmo federated GraphQL
3. Report page opens:
   - **Free**: summary, stats, 3D WebGL knowledge map, claim excerpt
   - **Paywalled**: contradictions, key people, full competitors, full sources
4. Click **Pay 1 USDC** → x402 + CDP settles → deep section reveals.
5. Ghost post URL + Senso `cited.md/article/<id>` URL surface on the report.

## 5. Architecture

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
                         │ pages + KB →   │
                         │ typed          │
                         │ CompanyInsight │
                         └──────┬─────────┘
                                │
   ┌──────────┬────────────┬────┴───────┬─────────────┐
   ▼          ▼            ▼            ▼             ▼
 Ghost     Senso        Wundergraph   cited.md      CDP + x402
 post      cited.md     Cosmo         local         deep-research
           citeable     federated                   unlock
                        subgraph
```

## 6. Sponsor stack — all real

| Sponsor | Role | Integration |
|---|---|---|
| **Redis Cloud** | Semantic memory; per-job facts; contradiction detection | `redis` client over `REDIS_URL`; verified writes; 24h TTL |
| **Ghost Pro** | Canonical public report; hosts the WebGL iframe | `@tryghost/admin-api`; published per run at `superbrain.ghost.io`; free-tier HTML only — no paywalled fields leak |
| **Senso** | cited.md per-run publishing + KB search + GEO monitoring | `apiv2.senso.ai/api/v1`; `/org/prompts` + `/org/content-engine/publish` per run; `/org/search` for grounding |
| **Wundergraph Cosmo** | Federated GraphQL — *the shape of the knowledge* | Subgraph `superbrain-intel` published via `wgc`, composed into federated graph `superbrain` |
| **TinyFish** | 4 parallel headless browser agents | `/v1/automation/run` with `X-API-Key`; per-call timeout 25s; parallel `Promise.all` over targets |
| **Coinbase CDP + x402** | Agent-native payment rail (1 USDC / unlock) | `@coinbase/x402` facilitator + `x402-next`'s `withX402` wrapper on `/api/deep/:id` |
| **Gemini (Google)** | LLM synthesis — real reasoning over pages + KB | `@google/genai`; `gemini-3.1-flash-lite-preview` (configurable via `AI_MODEL`); structured-JSON output with strict schema + URL-citation rule |
| ~~Nexla~~ | ~~Data structuring~~ | **Skipped** — empty account, no flow setup feasible in the timebox; silently dropped from the narrative |

## 7. Data model

```ts
CompanyInsight = {
  id, name, tagline, summary, generatedAt,
  officialClaims:  string[],
  publicSentiment: { score, trend, sampleMentions },
  employeeTrend:   { headcount, growth30d, signal: hiring|stable|layoffs|unknown },
  keyPeople:       Person[],         // real names from Gemini's synthesis
  competitors:     Competitor[],     // real companies from Gemini's synthesis
  contradictions:  Contradiction[],  // real claim vs counter-claim, both URL-cited
  sources:         Source[]
}
```

This single record drives every output surface: the Ghost post HTML, the cited.md citeable markdown, the GraphQL response, the WebGL knowledge map, and the local `cited.md` mirror.

## 8. Live proof points (verified during build)

- **Live Ghost posts per run** at `superbrain.ghost.io` (e.g. `/anthropic-intelligence-report/`, `/notion-intelligence-report/`, `/linear-intelligence-report/`), each with a 3D WebGL map embedded as an iframe
- **Live cited.md citeables per run**, e.g. `cited.md/article/c7e8abb0-1c2e-4dc0-9ee1-4b3701e4ae45` (Linear), `/article/a039ce29-741d-447e-87dc-67d760c2115a` (Notion)
- **Verified Gemini accuracy on "Notion"** — unprompted, returned `Ivan Zhao (CEO)`, `Simon Last`, `Akshay Kothari (COO)` as founders, and `Atlassian (Confluence/Jira)`, `Microsoft Loop`, `Obsidian`, `Coda` as competitors. All real, all correct.
- **Cosmo federated graph `superbrain`** with subgraph `superbrain-intel` composed and `is_composable: true`
- **Senso GEO monitoring** running Mon/Wed/Fri across ChatGPT, Claude, Perplexity, Gemini
- **End-to-end run latency** consistently 30–40s with all real clouds firing

## 9. Three-minute demo script

| Time | Action | Sponsor proof |
|---|---|---|
| 0:00 – 0:25 | Pitch: *"The web researches itself. You get paid."* Enter a company. | |
| 0:25 – 1:00 | Agent sidebar narrates: 4 parallel TinyFish browses, Redis memorizes, Senso grounds, Gemini synthesizes. | TinyFish, Redis, Senso, Gemini |
| 1:00 – 1:30 | Report opens — 3D knowledge map spins with real people and competitors. | Gemini-driven depth |
| 1:30 – 2:00 | Cut to live Ghost post — same WebGL map embedded in the public blog. | Ghost |
| 2:00 – 2:25 | Open cited.md article — citation is live and discoverable. | Senso cited.md |
| 2:25 – 2:45 | Flip to Cosmo playground — federated GraphQL query against the knowledge. | Wundergraph Cosmo |
| 2:45 – 3:00 | Click *Pay 1 USDC* — CDP/x402 settles — deep section reveals. | CDP + x402 |

## 10. Failover plan — never blank-screen on stage

Every real integration has a graceful fallback in `src/lib/adapters/`:

- **Gemini** down or no key → template synthesis (deterministic, still ships a report)
- **Senso** down → local `cited.md` still written; UI emits *"Senso publish skipped"* event with reason
- **Ghost** down → `/report/:id` renders the full report on our domain
- **Redis** down → in-process `Map` for the session
- **TinyFish** down → mock page generator keeps the loop running
- **CDP/x402** down → simulator path on `/api/pay/:id` accepts any signature
- **Cosmo** down → local `/api/graphql` still answers and the report is unaffected

## 11. Monetization

**Three streams, two revenue paths:**

1. **Ghost post** — *distribution, free.* Public marketing surface. Summary + stats + 3D map + a CTA driving readers to the paywalled deep view. Zero direct revenue.
2. **`/report/:id`** — *direct unlock, 1 USDC via x402 + CDP.* Deep-research fields gated; unlocked per report.
3. **`cited.md/article/:id`** — *citation royalties.* Every downstream agent that cites our cited.md entry triggers a Senso-metered fetch. SuperBrain becomes a first-class source in the agent economy, not just a consumer.

**Why this beats SaaS for agents:** agents don't sign up, don't auth, don't subscribe. They hit an endpoint, pay per request, move on. Per-request micropayments match the unit of work. Seat licenses don't.

## 12. Success criteria — all met

- ≥ 3 sponsor integrations real and live → **7**
- Live Ghost post URL with embedded WebGL → done per run
- cited.md citeable per run on Senso → done per run
- Gemini produces real, citable facts (not placeholders) → verified on Notion / Linear / Anthropic
- Complete run inside the 3-minute window → **~35s real, ~5s mocked**

## 13. Roadmap (next iteration)

- **Autonomous decision loop.** Replace the fixed pipeline with a Gemini/Claude agent that picks its own next browse target based on what's been found.
- **TinyFish `/run-async` with streaming results** — wait longer for richer extraction without burning the demo budget.
- **Real on-chain settlement on base mainnet.** CDP facilitator is wired; needs a real CDP-controlled wallet and end-to-end x402 client flow on a live invoice.
- **MCP server wrapper.** Expose SuperBrain as a tool Claude / Cursor / Codex can invoke natively.
- **Cross-subgraph federation.** Combine `superbrain-intel` with public people / funding / SEC subgraphs in Cosmo.
- **Scheduled re-runs** with diff alerts on material changes (new exec, sentiment flip, contradiction resolves).
- **GEO feedback loop** — close the compounding flywheel: probe results → tune prompts → tune KB → republish → improve visibility.
