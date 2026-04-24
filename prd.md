# SuperBrain — Web Intelligence Agent

**Product Requirements Document · v0.4 (hackathon build)**
_Last updated: 2026-04-24_

---

## 1. Vision

Ship an autonomous browser agent that researches any company across the open web, cross-references official claims against public signal, synthesizes the result with an LLM, and publishes a cited, federated, monetizable intelligence report. Every fetch the agent makes — and every subsequent fetch *by* another agent — is a citation, and a transaction.

## 2. Hackathon Alignment

| Requirement | How SuperBrain meets it |
|---|---|
| Autonomous agent, real action on the open web | TinyFish-driven browsing across company site, LinkedIn, X, news |
| Publish output to cited.md | **Every run publishes a new citeable to cited.md via Senso** — ~3 citeables already live from onboarding, plus one per research run |
| Monetize with agent payment rails | Deep-research section gated by x402 micropayment on Coinbase Developer Platform facilitator |
| Use 3+ sponsor tools | **7 real integrations**: Redis, Ghost, Senso, CDP + x402, Wundergraph Cosmo, TinyFish, Gemini |
| 3-minute demo | Full loop runs in ~35s; sub-5s with mocks |

## 3. Target Users

Job seekers, recruiters, and sales teams who need deep, unbiased, instantly-available company research. Plus other agents that want typed, federated knowledge they can query and cite.

## 4. Core User Flow

1. User enters a company name at `/`.
2. Agent runs — **Agent Status Sidebar** streams SSE events in real time:
   - **Browse** (TinyFish ×4 in parallel) — website, LinkedIn, X search, news
   - **Structure** — parses raw pages into typed facts
   - **Memory + cross-reference** (Redis) — writes facts, flags contradictions
   - **Ground** (Senso KB search) — retrieves curated context that grounds the synthesis
   - **Synthesize** (Gemini) — an LLM reasons over raw pages + KB context and produces a structured `CompanyInsight` (real people, real competitors, real contradictions)
   - **Publish** — Ghost post with WebGL iframe; Senso cited.md citeable; local `cited.md`
   - **Expose** — data is queryable via Wundergraph Cosmo federated GraphQL
3. Report page opens:
   - **Free:** summary, stats, 3D WebGL knowledge map, claim excerpt
   - **Paywalled:** contradictions, key people, full competitors, full sources
4. Click **Pay 1 USDC** → x402 + CDP settles → deep section reveals.
5. Ghost post URL + Senso `cited.md/article/<id>` URL both surface on the report.

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
                          │  reasons over  │
                          │  everything    │
                          │  → typed       │
                          │    CompanyInsight
                          └──────┬─────────┘
                                 │
   ┌──────────┬────────────┬─────┴──────┬─────────────┐
   ▼          ▼            ▼            ▼             ▼
 Ghost     Senso        Wundergraph   cited.md      CDP + x402
 post      cited.md     Cosmo         local         deep-research
           citeable     federated                   unlock
                        subgraph
```

## 6. Sponsor Stack — All Real

| Sponsor | Role | Status |
|---|---|---|
| **Redis Cloud** | Semantic memory; per-job facts; contradiction detection | **Live** |
| **Ghost Pro** | Canonical public report; hosts the WebGL iframe | **Live** — `superbrain.ghost.io` publishes per run |
| **Senso** | cited.md publishing (one per run) + KB grounding + GEO visibility | **Live** — per-run citeables + KB search + Mon/Wed/Fri GEO |
| **Wundergraph Cosmo** | Federated GraphQL — "shape of the knowledge" | **Live** — subgraph `superbrain-intel` composed in federated graph `superbrain` |
| **TinyFish** | Headless browsing across open web | **Live** — parallel `/v1/automation/run` calls per target |
| **Coinbase CDP + x402** | Agent-native payment rail | **Live** — CDP facilitator wired in `/api/deep/:id`; demo path uses simulator for on-stage reliability |
| **Gemini (Google)** | LLM synthesis — real reasoning over raw pages + KB | **Live** — `gemini-3.1-flash-lite-preview` (configurable via `AI_MODEL`), produces structured JSON |
| ~~Nexla~~ | ~~Data structuring~~ | **Skipped** |

## 7. Data Model

```ts
CompanyInsight = {
  id, name, tagline, summary, generatedAt,
  officialClaims: string[],
  publicSentiment: { score, trend, sampleMentions },
  employeeTrend:  { headcount, growth30d, signal: hiring|stable|layoffs|unknown },
  keyPeople:      Person[],         // real names inferred by Gemini
  competitors:    Competitor[],     // real companies inferred by Gemini
  contradictions: Contradiction[],  // real claim vs counter-claim, both URL-cited
  sources:        Source[]
}
```

## 8. Changes from v0.3

- **Gemini added as the synthesis brain.** Replaces the template synth. Reasons over TinyFish raw pages + Senso KB retrieval, produces real structured data.
- **Senso KB search step.** Before synthesis, `sensoSearch()` retrieves top relevant chunks and the grounded answer from our curated KB. Gemini receives both the raw open-web content AND our curated context, producing higher-quality output.
- **Sample real output on "Notion":** Gemini returned `Ivan Zhao (CEO)`, `Simon Last (Co-founder)`, `Akshay Kothari (COO)` as key people, and `Atlassian`, `Microsoft Loop`, `Obsidian`, `Coda` as competitors — all real, all correct, unprompted.
- **Fallback preserved.** When Gemini fails or no API key, the template synth runs.
- **Senso adapter fixed.** Was hitting wrong base URL (`sdk.senso.ai`); corrected to `apiv2.senso.ai/api/v1/org/content-engine/publish`. Per-run citeables now land on cited.md.
- **Ghost paywall leak fixed.** Ghost post now contains only the free tier (summary, stats, map, claim excerpt, CTA). Deep-research fields removed from public HTML.

## 9. Three-Minute Demo Plan

| Time | Action | Proof point |
|---|---|---|
| 0:00 – 0:25 | Pitch: "The web researches itself. You get paid." Enter a company. | |
| 0:25 – 1:00 | Agent sidebar narrates: 4 parallel TinyFish browses, Redis memorizes, Senso grounds, Gemini synthesizes. | **Real open-web action + real LLM reasoning** |
| 1:00 – 1:30 | Report opens — 3D knowledge map spins; real people and competitors shown. | Gemini-synthesized depth |
| 1:30 – 2:00 | Cut to live Ghost post — same WebGL map embedded. | **Ghost publishing** |
| 2:00 – 2:25 | Open cited.md article — citation is live and discoverable. | **Senso cited.md** |
| 2:25 – 2:45 | Flip to Cosmo playground — federated GraphQL query against the knowledge. | **Wundergraph Cosmo** |
| 2:45 – 3:00 | Click "Pay 1 USDC" — CDP/x402 settles — deep section reveals. | **Agent payment rails** |

## 10. Failover Plan

Every real integration has a graceful fallback in `src/lib/adapters/`:

- Gemini down or no key → template synthesis (deterministic, still ships a report).
- Senso down → local `cited.md` still written; UI shows "Senso publish skipped".
- Ghost down → `/report/:id` still renders the full report.
- Redis down → in-process `Map` for the session.
- TinyFish down → mock page generator keeps the loop running.
- CDP/x402 down → mock settle on `/api/pay/:id`.
- Cosmo down → local `/api/graphql` still answers.

## 11. Success Criteria

- ≥ 3 sponsor integrations real and live. **Currently 7.**
- Live Ghost post URL with embedded WebGL. **Done per run.**
- cited.md entry per run on Senso. **Done.**
- Gemini produces real, citable facts (not placeholders). **Verified on "Notion".**
- Complete run inside the 3-minute window. **~35s real, ~5s mocked.**
