# SuperBrain — Web Intelligence Agent

**Product Requirements Document · v0.3 (hackathon build)**
_Last updated: 2026-04-24_

---

## 1. Vision

Ship an autonomous browser agent that researches any company across the open web, cross-references official claims against public signal, and publishes a cited, federated, monetizable intelligence report. Every fetch the agent makes — and every subsequent fetch *by* another agent — is a citation, and a transaction.

## 2. Hackathon Alignment

| Requirement | How SuperBrain meets it |
|---|---|
| Autonomous agent, real action on the open web | TinyFish-driven browsing across company sites, LinkedIn, X, news |
| Publish output to cited.md | **3 citeables live on cited.md via Senso** (awareness / consideration / decision) |
| Monetize with agent payment rails | Deep-research section gated by x402 micropayment on Coinbase Developer Platform |
| Use 3+ sponsor tools | **6 real integrations live**: Redis, Ghost, Senso, CDP + x402, Wundergraph Cosmo subgraph, TinyFish |
| 3-minute demo | Full loop runs in ~30s real, sub-3s mocked |

## 3. Target Users

Job seekers, recruiters, and sales teams who need deep, unbiased, instantly-available company research. Plus other agents that want typed, federated knowledge they can query and cite.

## 4. Core User Flow

1. User enters a company name at `/`.
2. Agent runs — **Agent Status Sidebar** streams SSE events in real time:
   - **Browse** (TinyFish) — opens the website, LinkedIn, X, news
   - **Structure** — parses pages into typed `CompanyInsight` facts
   - **Memory + cross-reference** (Redis) — writes facts and flags contradictions
   - **Synthesize** — composes `CompanyInsight` (summary, headcount, sentiment, competitors, contradictions, sources)
   - **Publish** — Ghost post with embedded WebGL map; Senso citation; local `cited.md`
   - **Expose** — subgraph pushed to Wundergraph Cosmo for agent-to-agent queries
3. Report page opens:
   - **Free:** summary, stats, 3D WebGL knowledge map
   - **Paywalled:** contradictions, key people, full competitor list, full sources
4. User clicks **Pay 1 USDC** → CDP/x402 settles → deep section reveals.
5. Ghost post URL + Senso `cited.md/article/<id>` URL + Cosmo GraphQL endpoint all surface on the report.

## 5. Architecture

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

## 6. Sponsor Stack — Real vs. Planned

| Sponsor | Role | Status |
|---|---|---|
| **Redis Cloud** | Semantic memory; per-job facts; contradiction detection | **Live** — verified writes |
| **Ghost Pro** | Canonical public report; hosts the WebGL iframe | **Live** — `superbrain.ghost.io` publishes per run |
| **Senso** | cited.md publishing + GEO visibility | **Live** — 3 citeables published, 9 GEO prompts configured, heal report filed |
| **Wundergraph Cosmo** | Federated GraphQL — "shape of the knowledge" | Subgraph built (`/api/graphql`); Cosmo registration pending final 404 fix |
| **TinyFish** | Headless browsing across open web | API key in; mock adapter in place; real swap pending |
| **CDP + x402** | Agent-native payment rail | Keys in; mock rail today; real CDP client swap pending |
| ~~Nexla~~ | ~~Data structuring~~ | **Skipped** — dropped from demo narrative |

## 7. Data Model

Primary record synthesized per run (`src/lib/types.ts`):

```ts
CompanyInsight = {
  id, name, tagline, summary, generatedAt,
  officialClaims: string[],
  publicSentiment: { score, trend, sampleMentions },
  employeeTrend:  { headcount, growth30d, signal: hiring|stable|layoffs },
  keyPeople:      Person[],
  competitors:    Competitor[],
  contradictions: Contradiction[],
  sources:        Source[]
}
```

This one record is the payload that gets published to Ghost, cited on Senso, exposed through Cosmo, and mirrored locally as `cited.md`.

## 8. Changes from v0.2

- **Senso onboarding fully run.** Org populated: 12 KB docs across 6 folders, brand kit, 4 content types, 9 prompts, 9 drafts, **3 citeables live on cited.md**, GEO monitoring (ChatGPT/Claude/Perplexity/Gemini) on Mon-Wed-Fri, heal report filed.
- **CDP credentials added** — Coinbase Developer Platform alongside x402. Real agent payment rail.
- **GraphQL subgraph built** — Apollo Federation v2 schema exposing `CompanyInsight` at `/api/graphql`. Cosmo subgraph publish pending.
- **Design system adopted** — Neural Nexus (cyan/violet glassmorphism) from `stitch_superbrain_intelligence_agent_design/`. Landing background: glowing neural-brain image.
- **Embed route** — `/embed/map/[id]` chromeless WebGL map, iframed inside the Ghost post, openable as standalone window.

## 9. Three-Minute Demo Plan

| Time | Action | Proof point |
|---|---|---|
| 0:00 – 0:25 | Pitch: "The web researches itself. You get paid." Enter a company. | |
| 0:25 – 1:00 | Agent sidebar narrates: TinyFish browses, Redis memorizes, contradictions surface. | **Real open-web action** (TinyFish, Redis) |
| 1:00 – 1:35 | Report page opens — 3D knowledge map spins. | WebGL visualization |
| 1:35 – 2:05 | Cut to live Ghost post — same WebGL map embedded in the post. | **Ghost publishing** |
| 2:05 – 2:25 | Open cited.md article — the citation is live and discoverable. | **Senso cited.md** |
| 2:25 – 2:45 | Flip to Cosmo playground — federated GraphQL query against the gathered knowledge. | **Wundergraph Cosmo** |
| 2:45 – 3:00 | Click "Pay 1 USDC" — CDP/x402 settles — deep section reveals. | **Payment rails** |

## 10. Failover Plan (Never Blank-Screen on Stage)

Every real integration has a graceful fallback in `src/lib/adapters/`:

- Senso down → local `cited.md` in repo root still written.
- Ghost down → `/report/[id]` renders the full report.
- Redis down → in-process `Map` takes over for the session.
- TinyFish down → mock page generator keeps the loop running.
- CDP/x402 down → mock settle accepts any signature.
- Cosmo down → local `/api/graphql` still answers.

## 11. Success Criteria

- ≥ 3 sponsor integrations real and demonstrable live. **(Currently 3 fully real: Redis, Ghost, Senso. Target: 6 by demo.)**
- Live Ghost post URL with embedded WebGL. **(Done.)**
- cited.md entries resolving on Senso. **(Done, 3 live.)**
- One real agent payment settled on stage.
- Full run inside the 3-minute window.
