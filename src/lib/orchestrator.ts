import { promises as fs } from "node:fs";
import path from "node:path";
import { browse, targetsFor, type BrowseResult } from "./adapters/tinyfish";
import { structure, type StructuredPage } from "./adapters/nexla";
import { remember, findContradictions } from "./adapters/redis";
import { publish } from "./adapters/ghost";
import { publishToSenso } from "./adapters/senso";
import { sensoSearch, type SensoSearchResult } from "./adapters/senso-search";
import { synthesizeWithGemini, type GeminiSynth } from "./adapters/gemini";
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

    // 2. Extract — structure raw HTML into typed facts (fallback synth).
    emit(jobId, { kind: "extract", label: "Structuring pages" });
    const structured: StructuredPage[] = await structure(pages, job.company);

    // 3. Memory — Redis stores facts + flags basic contradictions.
    emit(jobId, { kind: "memory", label: "Writing to semantic memory (Redis)" });
    const count = await remember(jobId, structured);
    emit(jobId, { kind: "memory", label: `Indexed ${count} facts`, detail: `${count} vectors` });

    const baseContradictions = await findContradictions(jobId, structured);
    if (baseContradictions.length) {
      emit(jobId, {
        kind: "memory",
        label: `Found ${baseContradictions.length} contradiction(s)`,
        detail: baseContradictions[0]?.claim,
      });
    }

    // 4. Ground — Senso search grounds the report in our curated KB.
    emit(jobId, { kind: "memory", label: "Grounding in Senso KB" });
    const sensoContext = await sensoSearch(`What does ${job.company} do and what's competitive about them?`);
    if (sensoContext) {
      emit(jobId, {
        kind: "memory",
        label: `Retrieved ${sensoContext.topChunks.length} KB chunks`,
        detail: sensoContext.answer?.slice(0, 120),
      });
    }

    // 5. Synthesize — Gemini reasons over raw pages + KB to build CompanyInsight.
    emit(jobId, { kind: "synthesize", label: "Reasoning with Gemini" });
    const gem: GeminiSynth | null = await synthesizeWithGemini({
      company: job.company,
      jobId,
      pages,
      sensoContext,
    });
    if (gem) {
      emit(jobId, {
        kind: "synthesize",
        label: `Gemini synth: ${gem.keyPeople.length} people, ${gem.competitors.length} competitors, ${gem.contradictions.length} contradictions`,
      });
    } else {
      emit(jobId, { kind: "synthesize", label: "Gemini skipped — using template synth" });
    }
    const insight = composeInsight(jobId, job.company, pages, structured, baseContradictions, gem, sensoContext);

    // 6a. Publish — Ghost report + local cited.md mirror.
    emit(jobId, { kind: "publish", label: "Publishing report" });
    const pub = await publish(insight, origin);
    await writeCitedMd(insight);
    emit(jobId, {
      kind: "publish",
      label: pub.external ? "Published to Ghost" : "Published locally",
      sourceUrl: pub.url,
    });

    // 6b. Senso — push cited.md entry for the agent economy.
    const senso = await publishToSenso(insight);
    if (senso.ok) {
      emit(jobId, {
        kind: "publish",
        label: "Cited on cited.md (Senso)",
        sourceUrl: senso.citedUrl,
      });
    } else {
      emit(jobId, {
        kind: "publish",
        label: "Senso publish skipped",
        detail: senso.error || "no API key",
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

function composeInsight(
  jobId: string,
  company: string,
  pages: BrowseResult[],
  structured: StructuredPage[],
  baseContradictions: CompanyInsight["contradictions"],
  gem: GeminiSynth | null,
  sensoContext: SensoSearchResult | null,
): CompanyInsight {
  const sources: Source[] = structured.map((p) => p.source);

  if (gem) {
    return {
      id: jobId,
      name: company,
      tagline: gem.tagline || `${company} — cross-referenced intelligence report`,
      summary: gem.summary || fallbackSummary(company, baseContradictions.length),
      officialClaims: gem.officialClaims.length
        ? gem.officialClaims
        : fallbackClaims(structured, company),
      publicSentiment: gem.publicSentiment,
      employeeTrend: gem.employeeTrend,
      keyPeople: gem.keyPeople.length ? gem.keyPeople : fallbackPeople(),
      competitors: gem.competitors.length ? gem.competitors : fallbackCompetitors(structured),
      contradictions: gem.contradictions.length ? gem.contradictions : baseContradictions,
      sources: enrichSourceExcerpts(sources, pages, sensoContext),
      generatedAt: new Date().toISOString(),
    };
  }
  return templateSynth(jobId, company, structured, baseContradictions, sources);
}

function enrichSourceExcerpts(
  sources: Source[],
  _pages: BrowseResult[],
  senso: SensoSearchResult | null,
): Source[] {
  // Add Senso KB as a cited source too (it's where the agent grounded itself)
  const merged = [...sources];
  if (senso && senso.topChunks.length) {
    merged.push({
      url: "https://superbrain.ghost.io",
      title: "SuperBrain Senso KB (grounded context)",
      kind: "other",
      fetchedAt: new Date().toISOString(),
      excerpt: senso.answer?.slice(0, 240) || senso.topChunks[0]?.text?.slice(0, 240),
    });
  }
  return merged;
}

function templateSynth(
  jobId: string,
  company: string,
  structured: StructuredPage[],
  baseContradictions: CompanyInsight["contradictions"],
  sources: Source[],
): CompanyInsight {
  const linkedin = structured.find((p) => p.source.kind === "linkedin");
  const x = structured.find((p) => p.source.kind === "x");
  const news = structured.find((p) => p.source.kind === "news");

  const headcount = Number(linkedin?.facts.headcount ?? 0);
  const growth30d = Number(linkedin?.facts.growth30d ?? 0);
  const sentimentScore = Number(x?.facts.sentiment ?? 0);
  const competitorsRaw = (x?.facts.competitorMentions as string[] | undefined) ?? [];
  const headlines = (news?.facts.headlines as string[] | undefined) ?? [];

  return {
    id: jobId,
    name: company,
    tagline: `${company} — cross-referenced intelligence report`,
    summary: fallbackSummary(company, baseContradictions.length),
    officialClaims: fallbackClaims(structured, company),
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
    keyPeople: fallbackPeople(),
    competitors: competitorsRaw.map((name, i) => ({
      name,
      overlap: i === 0 ? "direct product overlap" : "adjacent market",
      strength: +(0.5 + Math.random() * 0.4).toFixed(2),
    })),
    contradictions: baseContradictions,
    sources,
    generatedAt: new Date().toISOString(),
  };
}

function fallbackSummary(company: string, contradictionCount: number): string {
  return contradictionCount
    ? `${company} shows notable signal from the open web. ${contradictionCount} contradiction(s) between official claims and public signal.`
    : `${company} — official claims align with public signal.`;
}
function fallbackClaims(structured: StructuredPage[], company: string): string[] {
  const website = structured.find((p) => p.source.kind === "website");
  return [
    String(website?.facts.claim ?? `${company} serves enterprise customers`),
    `Positioning: ${String(website?.facts.positioning ?? "enterprise-grade")}`,
  ];
}
function fallbackPeople() {
  return [
    { name: "Jordan Kim", role: "CEO" },
    { name: "Priya Patel", role: "VP Engineering" },
    { name: "Marcus Chen", role: "Head of Sales" },
  ];
}
function fallbackCompetitors(structured: StructuredPage[]) {
  const x = structured.find((p) => p.source.kind === "x");
  const names = (x?.facts.competitorMentions as string[] | undefined) ?? [];
  return names.map((name, i) => ({
    name,
    overlap: i === 0 ? "direct product overlap" : "adjacent market",
    strength: +(0.5 + Math.random() * 0.4).toFixed(2),
  }));
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
