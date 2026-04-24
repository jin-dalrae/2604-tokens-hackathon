import { GoogleGenAI } from "@google/genai";
import type { BrowseResult } from "./tinyfish";
import type { SensoSearchResult } from "./senso-search";

// Gemini synthesis adapter. Reads the raw TinyFish results plus curated
// Senso KB context and produces a typed CompanyInsight. Falls back to the
// template synth when no key or when generation fails.
//
// Model default: gemini-3.1-flash-lite-preview (cheap, fast, structured-JSON).
// Override via AI_MODEL env.

const MODEL_NAME = process.env.AI_MODEL || "gemini-2.5-flash";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (client) return client;
  client = new GoogleGenAI({ apiKey: key });
  return client;
}

export interface GeminiSynthInput {
  company: string;
  jobId: string;
  pages: BrowseResult[];
  sensoContext: SensoSearchResult | null;
}

export interface GeminiSynth {
  tagline: string;
  summary: string;
  officialClaims: string[];
  publicSentiment: {
    score: number;
    trend: "up" | "down" | "flat";
    sampleMentions: string[];
  };
  employeeTrend: {
    headcount: number;
    growth30d: number;
    signal: "hiring" | "stable" | "layoffs" | "unknown";
  };
  keyPeople: Array<{ name: string; role: string; linkedinUrl?: string }>;
  competitors: Array<{ name: string; overlap: string; strength: number }>;
  contradictions: Array<{
    claim: string;
    officialSource: string;
    counterEvidence: string;
    counterSource: string;
  }>;
}

const SYSTEM_PROMPT = `You are SuperBrain — an autonomous web-intelligence agent. You have just browsed a company across four live web sources (website, LinkedIn, X/Twitter, news) and received curated context from a trusted knowledge base. Your job is to produce a rigorous, cross-referenced Company Insight as strict JSON.

Rules:
1. Every claim in "summary" and "officialClaims" must be supported by at least one of the fetched pages.
2. Every entry in "contradictions" must cite a real URL from the fetched pages for both sides.
3. If a field cannot be supported by the data, use a sensible default (headcount 0, sentiment 0, etc.) and note it, but do not invent specific people or numbers you did not see.
4. "competitors" should be real named companies you saw mentioned in the fetched data or inferred from positioning, never placeholder names.
5. Prefer concrete over abstract. Name specific products, specific numbers, specific people.
6. Output JSON ONLY, no prose. The JSON MUST conform exactly to the schema the user provides.`;

const JSON_SCHEMA_INSTRUCTIONS = `Return valid JSON with this exact shape:
{
  "tagline": string,
  "summary": string,  // 2-4 sentences, concrete, cross-referenced
  "officialClaims": string[],  // 3-6 direct claims from the company website
  "publicSentiment": {
    "score": number,  // -1 to 1
    "trend": "up" | "down" | "flat",
    "sampleMentions": string[]  // 2-4 real mentions, paraphrased
  },
  "employeeTrend": {
    "headcount": number,
    "growth30d": number,  // 0.04 = 4%
    "signal": "hiring" | "stable" | "layoffs" | "unknown"
  },
  "keyPeople": [  // 3-6 real named people from data, with roles
    { "name": string, "role": string, "linkedinUrl"?: string }
  ],
  "competitors": [  // 3-5 real companies
    { "name": string, "overlap": string, "strength": number }  // strength 0-1
  ],
  "contradictions": [  // 0-3 real conflicts between official and public sources
    {
      "claim": string,
      "officialSource": string,  // must be a real URL from the inputs
      "counterEvidence": string,
      "counterSource": string  // must be a real URL from the inputs
    }
  ]
}`;

export async function synthesizeWithGemini(
  input: GeminiSynthInput,
): Promise<GeminiSynth | null> {
  const c = getClient();
  if (!c) return null;

  const userPrompt = buildUserPrompt(input);

  try {
    const res = await c.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.35,
      },
    });
    const text = res.text;
    if (!text) {
      console.error("[gemini] empty response");
      return null;
    }
    const parsed = JSON.parse(stripJsonFences(text)) as GeminiSynth;
    return sanitize(parsed);
  } catch (err) {
    console.error("[gemini] generation failed", err instanceof Error ? err.message : err);
    return null;
  }
}

function buildUserPrompt(input: GeminiSynthInput): string {
  const lines: string[] = [];
  lines.push(`## Target company\n${input.company}\n`);

  lines.push("## Live open-web sources fetched by TinyFish");
  for (const p of input.pages) {
    lines.push(`\n### [${p.kind}] ${p.label}`);
    lines.push(`URL: ${p.url}`);
    lines.push(`Live call: ${p.realCall ? "yes (real browser agent)" : "no (mock fallback)"}`);
    const snippet = extractText(p);
    lines.push(`Snippet:\n${snippet.slice(0, 2400)}`);
    if (p.extracted) {
      lines.push(`Extracted: ${safeJson(p.extracted).slice(0, 1200)}`);
    }
  }

  if (input.sensoContext) {
    lines.push("\n## Curated Senso KB context (our own prior knowledge)");
    if (input.sensoContext.answer) {
      lines.push(`Grounded answer: ${input.sensoContext.answer}`);
    }
    for (const c of input.sensoContext.topChunks.slice(0, 4)) {
      lines.push(`- (${c.score.toFixed(2)}) ${c.title}: ${c.text.slice(0, 400)}`);
    }
  }

  lines.push("\n## Task");
  lines.push(
    `Synthesize a Company Insight for ${input.company}, cross-referencing the official site against LinkedIn, X, and news. Flag contradictions you can actually cite.`,
  );
  lines.push("");
  lines.push(JSON_SCHEMA_INSTRUCTIONS);
  return lines.join("\n");
}

function extractText(p: BrowseResult): string {
  if (p.html) {
    return p.html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return safeJson(p.extracted);
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function stripJsonFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (m ? m[1] : s).trim();
}

function sanitize(g: GeminiSynth): GeminiSynth {
  return {
    tagline: String(g.tagline || ""),
    summary: String(g.summary || ""),
    officialClaims: arr<string>(g.officialClaims, (x) => String(x)),
    publicSentiment: {
      score: clamp(Number(g.publicSentiment?.score ?? 0), -1, 1),
      trend: (["up", "down", "flat"].includes(String(g.publicSentiment?.trend))
        ? g.publicSentiment.trend
        : "flat") as "up" | "down" | "flat",
      sampleMentions: arr<string>(g.publicSentiment?.sampleMentions, (x) => String(x)).slice(0, 6),
    },
    employeeTrend: {
      headcount: Math.max(0, Math.round(Number(g.employeeTrend?.headcount ?? 0))),
      growth30d: Number(g.employeeTrend?.growth30d ?? 0),
      signal: (["hiring", "stable", "layoffs", "unknown"].includes(String(g.employeeTrend?.signal))
        ? g.employeeTrend.signal
        : "unknown") as "hiring" | "stable" | "layoffs" | "unknown",
    },
    keyPeople: arr<{ name: string; role: string; linkedinUrl?: string }>(
      g.keyPeople,
      (raw) => {
        const p = asObj(raw);
        return {
          name: String(p.name ?? ""),
          role: String(p.role ?? ""),
          linkedinUrl: p.linkedinUrl ? String(p.linkedinUrl) : undefined,
        };
      },
    ).filter((p) => p.name),
    competitors: arr<{ name: string; overlap: string; strength: number }>(
      g.competitors,
      (raw) => {
        const c = asObj(raw);
        return {
          name: String(c.name ?? ""),
          overlap: String(c.overlap ?? ""),
          strength: clamp(Number(c.strength ?? 0.5), 0, 1),
        };
      },
    ).filter((c) => c.name),
    contradictions: arr<{
      claim: string;
      officialSource: string;
      counterEvidence: string;
      counterSource: string;
    }>(g.contradictions, (raw) => {
      const c = asObj(raw);
      return {
        claim: String(c.claim ?? ""),
        officialSource: String(c.officialSource ?? ""),
        counterEvidence: String(c.counterEvidence ?? ""),
        counterSource: String(c.counterSource ?? ""),
      };
    }).filter((c) => c.claim && c.officialSource && c.counterSource),
  };
}

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function arr<T>(v: unknown, mapper: (x: unknown) => T): T[] {
  return Array.isArray(v) ? v.map(mapper) : [];
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return (min + max) / 2;
  return Math.min(max, Math.max(min, n));
}
