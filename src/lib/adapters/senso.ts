import type { CompanyInsight } from "../types";

// Senso cited.md publishing adapter.
// POSTs a content item to https://sdk.senso.ai/api/v1/content — the item
// flows through the Senso content engine and publishes to cited.md.
// Falls back to a no-op when SENSO_API_KEY is absent so the app never crashes.

const SENSO_BASE = process.env.SENSO_BASE_URL || "https://sdk.senso.ai/api/v1";

export interface SensoPublishResult {
  ok: boolean;
  citedUrl?: string;
  contentId?: string;
}

export async function publishToSenso(insight: CompanyInsight): Promise<SensoPublishResult> {
  const key = process.env.SENSO_API_KEY;
  if (!key) return { ok: false };

  const body = renderSensoBody(insight);

  try {
    const res = await fetch(`${SENSO_BASE}/content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[senso] publish failed", res.status, await res.text().catch(() => ""));
      return { ok: false };
    }
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      url?: string;
      citeables_url?: string;
    };
    return {
      ok: true,
      contentId: json.id,
      citedUrl: json.citeables_url || json.url,
    };
  } catch (err) {
    console.error("[senso] network error", err);
    return { ok: false };
  }
}

function renderSensoBody(insight: CompanyInsight) {
  const lines: string[] = [];
  lines.push(`# ${insight.name} — Intelligence Report`);
  lines.push("");
  lines.push(insight.summary);
  lines.push("");
  lines.push(`**Headcount:** ${insight.employeeTrend.headcount}`);
  lines.push(`**30-day growth:** ${(insight.employeeTrend.growth30d * 100).toFixed(1)}% (${insight.employeeTrend.signal})`);
  lines.push(`**Sentiment:** ${insight.publicSentiment.score.toFixed(2)} (${insight.publicSentiment.trend})`);
  lines.push("");
  lines.push("## Official Claims");
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
  lines.push("## Key People");
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
  lines.push("*Powered by SuperBrain · grounded in Senso*");

  return {
    title: `${insight.name} — Intelligence Report`,
    text: lines.join("\n"),
    tags: ["superbrain", "intelligence-report", insight.name.toLowerCase().replace(/\s+/g, "-")],
  };
}
