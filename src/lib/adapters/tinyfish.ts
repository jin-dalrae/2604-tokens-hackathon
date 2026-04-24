import type { Source } from "../types";

const TF_BASE = process.env.TINYFISH_BASE_URL || "https://agent.tinyfish.ai/v1/automation";
const TF_KEY = process.env.TinyFish_API || process.env.TINYFISH_API_KEY;

export interface BrowseTarget {
  label: string;
  url: string;
  kind: Source["kind"];
  goal: string;
}

export interface BrowseResult extends BrowseTarget {
  html: string;
  fetchedAt: string;
  // structured extraction returned by the TinyFish agent, when available
  extracted?: unknown;
  realCall: boolean;
}

// TinyFish driver. When TINYFISH_API_KEY is set, POSTs /v1/automation/run and
// captures the agent's extracted structured data. Falls back to a mock so the
// whole app keeps working offline (and the demo never blank-screens).
export async function browse(target: BrowseTarget): Promise<BrowseResult> {
  if (!TF_KEY) return mockBrowse(target);

  try {
    const res = await fetch(`${TF_BASE}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": TF_KEY,
      },
      body: JSON.stringify({ url: target.url, goal: target.goal }),
      // TinyFish /run blocks until completion — cap at 60s per target
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error("[tinyfish] non-2xx", res.status, await res.text().catch(() => ""));
      return mockBrowse(target);
    }
    const body = (await res.json().catch(() => ({}))) as {
      html?: string;
      text?: string;
      data?: unknown;
      result?: unknown;
      status?: string;
    };
    const html = body.html || (typeof body.text === "string" ? body.text : "") || "";
    return {
      ...target,
      html,
      extracted: body.data ?? body.result,
      fetchedAt: new Date().toISOString(),
      realCall: true,
    };
  } catch (err) {
    console.error("[tinyfish] network error, falling back to mock", err);
    return mockBrowse(target);
  }
}

function mockBrowse(target: BrowseTarget): BrowseResult {
  return {
    ...target,
    html: `<html data-mock="tinyfish"><title>${target.label}</title></html>`,
    fetchedAt: new Date().toISOString(),
    realCall: false,
  };
}

export function targetsFor(company: string): BrowseTarget[] {
  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [
    {
      label: `${company} — official site`,
      url: `https://${slug}.com`,
      kind: "website",
      goal: `Extract the company mission, core product descriptions, and any stated claims about customers served, scale, or positioning.`,
    },
    {
      label: `${company} — LinkedIn`,
      url: `https://www.linkedin.com/company/${slug}`,
      kind: "linkedin",
      goal: `Find headcount, 30-day employee growth trend, top hiring functions, and any recent leadership changes.`,
    },
    {
      label: `${company} — X / Twitter`,
      url: `https://x.com/search?q=${encodeURIComponent(company)}`,
      kind: "x",
      goal: `Summarize recent public mentions of ${company}: overall sentiment, top complaints, competitor mentions.`,
    },
    {
      label: `${company} — news`,
      url: `https://news.google.com/search?q=${encodeURIComponent(company)}`,
      kind: "news",
      goal: `List the 5 most recent news headlines mentioning ${company} with publication date and one-line summary.`,
    },
  ];
}
