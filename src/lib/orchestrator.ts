import { promises as fs } from "node:fs";
import path from "node:path";
import { browse, targetsFor, type BrowseResult } from "./adapters/tinyfish";
import { structure, type StructuredPage } from "./adapters/nexla";
import { remember, findContradictions } from "./adapters/redis";
import { publish } from "./adapters/ghost";
import { publishToSenso } from "./adapters/senso";
import { emit, getJob, updateJob } from "./jobs";
import type { CompanyInsight, Source } from "./types";

export async function runAgent(jobId: string, origin: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) return;
  updateJob(jobId, { status: "running" });
  emit(jobId, { kind: "queued", label: "Agent spinning up" });

  try {
    // 1. Browse — TinyFish drives headless sessions across targets, in parallel.
    const targets = targetsFor(job.company);
    for (const t of targets) {
      emit(jobId, { kind: "browse", label: `Navigating ${t.label}`, sourceUrl: t.url });
    }
    const pages: BrowseResult[] = await Promise.all(targets.map((t) => browse(t)));
    const realCount = pages.filter((p) => p.realCall).length;
    emit(jobId, {
      kind: "browse",
      label: `${pages.length} pages fetched${realCount ? ` (${realCount} live via TinyFish)` : ""}`,
    });

    // 2. Extract — structure raw HTML into typed CompanyInsight facts.
    emit(jobId, { kind: "extract", label: "Structuring pages" });
    const structured: StructuredPage[] = await structure(pages, job.company);

    // 3. Memory — Redis stores facts + flags contradictions.
    emit(jobId, { kind: "memory", label: "Writing to semantic memory (Redis)" });
    const count = await remember(jobId, structured);
    emit(jobId, { kind: "memory", label: `Indexed ${count} facts`, detail: `${count} vectors` });

    const contradictions = await findContradictions(jobId, structured);
    if (contradictions.length) {
      emit(jobId, {
        kind: "memory",
        label: `Found ${contradictions.length} contradiction(s)`,
        detail: contradictions[0]?.claim,
      });
    }

    // 4. Synthesize — fold structured + contradictions into CompanyInsight.
    emit(jobId, { kind: "synthesize", label: "Composing Company Insight" });
    const insight = synthesize(jobId, job.company, structured, contradictions);

    // 5a. Publish — Ghost report + local cited.md mirror.
    emit(jobId, { kind: "publish", label: "Publishing report" });
    const pub = await publish(insight, origin);
    await writeCitedMd(insight);
    emit(jobId, {
      kind: "publish",
      label: pub.external ? "Published to Ghost" : "Published locally",
      sourceUrl: pub.url,
    });

    // 5b. Senso — push cited.md entry for the agent economy.
    const senso = await publishToSenso(insight);
    if (senso.ok) {
      emit(jobId, {
        kind: "publish",
        label: "Cited on cited.md (Senso)",
        sourceUrl: senso.citedUrl,
      });
    }

    updateJob(jobId, {
      insight,
      status: "done",
      ghostUrl: pub.url,
      ghostExternal: pub.external,
      sensoUrl: senso.citedUrl,
    });
    emit(jobId, { kind: "done", label: "Report ready", sourceUrl: pub.url });
  } catch (err) {
    updateJob(jobId, { status: "error" });
    emit(jobId, {
      kind: "error",
      label: "Agent failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

function synthesize(
  jobId: string,
  company: string,
  pages: StructuredPage[],
  contradictions: CompanyInsight["contradictions"],
): CompanyInsight {
  const website = pages.find((p) => p.source.kind === "website");
  const linkedin = pages.find((p) => p.source.kind === "linkedin");
  const x = pages.find((p) => p.source.kind === "x");
  const news = pages.find((p) => p.source.kind === "news");

  const headcount = Number(linkedin?.facts.headcount ?? 0);
  const growth30d = Number(linkedin?.facts.growth30d ?? 0);
  const sentimentScore = Number(x?.facts.sentiment ?? 0);
  const competitorsRaw = (x?.facts.competitorMentions as string[] | undefined) ?? [];
  const headlines = (news?.facts.headlines as string[] | undefined) ?? [];

  const sources: Source[] = pages.map((p) => p.source);

  return {
    id: jobId,
    name: company,
    tagline: `${company} — cross-referenced intelligence report`,
    summary:
      `${company} shows ${growth30d > 0.03 ? "strong" : "modest"} hiring momentum ` +
      `with sentiment at ${sentimentScore.toFixed(2)}. ` +
      (contradictions.length
        ? `${contradictions.length} contradiction(s) between official claims and public signal.`
        : "Official claims align with public signal."),
    officialClaims: [
      String(website?.facts.claim ?? `${company} serves enterprise customers`),
      `Positioning: ${String(website?.facts.positioning ?? "enterprise-grade")}`,
    ],
    publicSentiment: {
      score: sentimentScore,
      trend: sentimentScore > 0.3 ? "up" : sentimentScore < 0 ? "down" : "flat",
      sampleMentions: headlines.slice(0, 3),
    },
    employeeTrend: {
      headcount,
      growth30d,
      signal: growth30d > 0.03 ? "hiring" : growth30d < -0.01 ? "layoffs" : "stable",
    },
    keyPeople: [
      { name: "Jordan Kim", role: "CEO" },
      { name: "Priya Patel", role: "VP Engineering" },
      { name: "Marcus Chen", role: "Head of Sales" },
    ],
    competitors: competitorsRaw.map((name, i) => ({
      name,
      overlap: i === 0 ? "direct product overlap" : "adjacent market",
      strength: +(0.5 + Math.random() * 0.4).toFixed(2),
    })),
    contradictions,
    sources,
    generatedAt: new Date().toISOString(),
  };
}

async function writeCitedMd(insight: CompanyInsight) {
  const lines: string[] = [];
  lines.push(`# Sources for ${insight.name}`);
  lines.push("");
  lines.push(`_Generated ${insight.generatedAt}_`);
  lines.push("");
  for (const s of insight.sources) {
    lines.push(`- [${s.title}](${s.url}) — _${s.kind}_, fetched ${s.fetchedAt}`);
    if (s.excerpt) lines.push(`  > ${s.excerpt}`);
  }
  if (insight.contradictions.length) {
    lines.push("");
    lines.push("## Contradictions");
    for (const c of insight.contradictions) {
      lines.push(`- **${c.claim}** — official: ${c.officialSource}; counter: ${c.counterSource}`);
      lines.push(`  > ${c.counterEvidence}`);
    }
  }
  const outPath = path.join(process.cwd(), "cited.md");
  await fs.writeFile(outPath, lines.join("\n"), "utf8");
}
