import type { CompanyInsight } from "../types";

// Senso cited.md publishing adapter.
// Per research run we:
//   1) POST /org/prompts   — create "Research: {company}" prompt, get prompt_id
//   2) POST /org/content-engine/publish  — publish the full report as a
//      citeable on cited.md bound to that prompt
// Falls back to no-op when SENSO_API_KEY is absent so the app never crashes.

const SENSO_BASE = process.env.SENSO_BASE_URL || "https://apiv2.senso.ai/api/v1";

export interface SensoPublishResult {
  ok: boolean;
  citedUrl?: string;
  contentId?: string;
  promptId?: string;
  error?: string;
}

export async function publishToSenso(insight: CompanyInsight): Promise<SensoPublishResult> {
  const key = process.env.SENSO_API_KEY;
  if (!key) return { ok: false, error: "no SENSO_API_KEY" };

  const question = `Intelligence report: ${insight.name}`;
  const promptId = await createPrompt(key, question);
  if (!promptId) return { ok: false, error: "prompt create failed" };

  const markdown = renderMarkdown(insight);
  const publishResp = await publishCiteable(key, {
    geo_question_id: promptId,
    seo_title: `${insight.name} — SuperBrain Intelligence Report`,
    summary: insight.summary.slice(0, 200),
    raw_markdown: markdown,
  });

  if (!publishResp.ok) return { ok: false, error: publishResp.error, promptId };

  return {
    ok: true,
    promptId,
    contentId: publishResp.contentId,
    citedUrl: publishResp.url,
  };
}

async function createPrompt(key: string, questionText: string): Promise<string | null> {
  try {
    const res = await fetch(`${SENSO_BASE}/org/prompts`, {
      method: "POST",
      headers: sensoHeaders(key),
      body: JSON.stringify({ question_text: questionText, type: "awareness" }),
    });
    if (!res.ok) {
      console.error("[senso] prompt create", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json().catch(() => ({}))) as { prompt_id?: string; id?: string };
    return data.prompt_id || data.id || null;
  } catch (err) {
    console.error("[senso] prompt create network error", err);
    return null;
  }
}

interface PublishArgs {
  geo_question_id: string;
  seo_title: string;
  summary: string;
  raw_markdown: string;
}
interface PublishResp {
  ok: boolean;
  url?: string;
  contentId?: string;
  error?: string;
}

async function publishCiteable(key: string, args: PublishArgs): Promise<PublishResp> {
  try {
    const res = await fetch(`${SENSO_BASE}/org/content-engine/publish`, {
      method: "POST",
      headers: sensoHeaders(key),
      body: JSON.stringify(args),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[senso] publish", res.status, text);
      return { ok: false, error: `${res.status} ${text.slice(0, 200)}` };
    }
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    const destinations = (parsed["publish_destinations"] as Array<{
      display_url?: string;
      publisher?: string;
    }>) || [];
    const citedMd = destinations.find((d) => d.publisher === "cited-md");
    return {
      ok: true,
      url: citedMd?.display_url,
      contentId: typeof parsed["content_id"] === "string" ? (parsed["content_id"] as string) : undefined,
    };
  } catch (err) {
    console.error("[senso] publish network error", err);
    return { ok: false, error: err instanceof Error ? err.message : "network" };
  }
}

function sensoHeaders(key: string): HeadersInit {
  return {
    "X-API-Key": key,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "superbrain-agent/0.3",
  };
}

function renderMarkdown(insight: CompanyInsight): string {
  const lines: string[] = [];
  lines.push(`# ${insight.name} — Intelligence Report`);
  lines.push("");
  lines.push(insight.summary);
  lines.push("");
  lines.push(`**Headcount:** ${insight.employeeTrend.headcount}`);
  lines.push(`**30-day growth:** ${(insight.employeeTrend.growth30d * 100).toFixed(1)}% (${insight.employeeTrend.signal})`);
  lines.push(`**Sentiment:** ${insight.publicSentiment.score.toFixed(2)} (${insight.publicSentiment.trend})`);
  lines.push("");
  lines.push("## Official claims");
  for (const c of insight.officialClaims) lines.push(`- ${c}`);
  lines.push("");
  if (insight.contradictions.length) {
    lines.push("## Contradictions");
    for (const c of insight.contradictions) {
      lines.push(`- **${c.claim}**`);
      lines.push(`  - counter: ${c.counterEvidence}`);
      lines.push(`  - official source: ${c.officialSource}`);
      lines.push(`  - counter source: ${c.counterSource}`);
    }
    lines.push("");
  }
  lines.push("## Key people");
  for (const p of insight.keyPeople) lines.push(`- **${p.name}** — ${p.role}`);
  lines.push("");
  lines.push("## Competitors");
  for (const c of insight.competitors) {
    lines.push(`- **${c.name}** — ${c.overlap} (${(c.strength * 100).toFixed(0)}%)`);
  }
  lines.push("");
  lines.push("## Sources");
  for (const s of insight.sources) {
    lines.push(`- [${s.kind}] [${s.title}](${s.url})`);
  }
  lines.push("");
  lines.push("---");
  lines.push("*Powered by SuperBrain · cited via Senso*");
  return lines.join("\n");
}
