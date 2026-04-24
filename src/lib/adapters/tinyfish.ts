import type { Source } from "../types";

export interface BrowseTarget {
  label: string;
  url: string;
  kind: Source["kind"];
}

export interface BrowseResult extends BrowseTarget {
  html: string;
  fetchedAt: string;
}

// Mock TinyFish adapter. Swap impl when real credentials arrive; keep the shape.
export async function browse(target: BrowseTarget): Promise<BrowseResult> {
  await sleep(400 + Math.random() * 500);
  return {
    ...target,
    html: `<html data-mock="tinyfish"><title>${target.label}</title></html>`,
    fetchedAt: new Date().toISOString(),
  };
}

export function targetsFor(company: string): BrowseTarget[] {
  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [
    { label: `${company} — official site`, url: `https://${slug}.com`, kind: "website" },
    { label: `${company} — LinkedIn`, url: `https://www.linkedin.com/company/${slug}`, kind: "linkedin" },
    { label: `${company} — X / Twitter`, url: `https://x.com/search?q=${encodeURIComponent(company)}`, kind: "x" },
    { label: `${company} — news`, url: `https://news.google.com/search?q=${encodeURIComponent(company)}`, kind: "news" },
  ];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
