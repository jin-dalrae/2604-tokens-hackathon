// Senso search adapter — grounds each research run in our curated KB.
// Hits /org/search, returns the AI-synthesized answer + top chunks.
// Silent no-op when SENSO_API_KEY is absent.

const SENSO_BASE = process.env.SENSO_BASE_URL || "https://apiv2.senso.ai/api/v1";

export interface SensoSearchResult {
  query: string;
  answer?: string;
  topChunks: Array<{ title: string; text: string; score: number; sourceUrl?: string }>;
}

export async function sensoSearch(query: string): Promise<SensoSearchResult | null> {
  const key = process.env.SENSO_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${SENSO_BASE}/org/search`, {
      method: "POST",
      headers: {
        "X-API-Key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "superbrain-agent/0.3",
      },
      body: JSON.stringify({ query, limit: 5 }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error("[senso-search]", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json().catch(() => ({}))) as {
      query?: string;
      answer?: string;
      results?: Array<{ title?: string; chunk_text?: string; score?: number; source_url?: string }>;
    };
    return {
      query: data.query || query,
      answer: data.answer,
      topChunks: (data.results || []).map((r) => ({
        title: r.title || "",
        text: r.chunk_text || "",
        score: r.score || 0,
        sourceUrl: r.source_url,
      })),
    };
  } catch (err) {
    console.error("[senso-search] network", err);
    return null;
  }
}
