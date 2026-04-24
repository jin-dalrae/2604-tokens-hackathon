import type { BrowseResult } from "./tinyfish";
import type { Source } from "../types";

export interface StructuredPage {
  source: Source;
  facts: Record<string, string | number | string[]>;
}

// Mock Nexla adapter: turns raw HTML into structured facts.
// Swap with real Nexla flow invocation when creds land.
export async function structure(pages: BrowseResult[], company: string): Promise<StructuredPage[]> {
  await sleep(300);
  return pages.map((p) => ({
    source: {
      url: p.url,
      title: p.label,
      kind: p.kind,
      fetchedAt: p.fetchedAt,
      excerpt: synthExcerpt(p, company),
    },
    facts: synthFacts(p, company),
  }));
}

function synthExcerpt(p: BrowseResult, company: string): string {
  switch (p.kind) {
    case "website":
      return `${company} positions itself as a leading platform with enterprise customers.`;
    case "linkedin":
      return `${company} headcount grew ~4% in the last 30 days; heavy hiring in eng & sales.`;
    case "x":
      return `Mentions of ${company} trend positive, with occasional concern about pricing.`;
    case "news":
      return `Recent coverage of ${company} focuses on product launches and funding.`;
    default:
      return "";
  }
}

function synthFacts(p: BrowseResult, company: string): Record<string, string | number | string[]> {
  switch (p.kind) {
    case "website":
      return {
        claim: `${company} serves Fortune 500 customers`,
        positioning: "enterprise-grade",
      };
    case "linkedin":
      return {
        headcount: 420 + Math.floor(Math.random() * 80),
        growth30d: +(0.02 + Math.random() * 0.05).toFixed(3),
        topRoles: ["Engineer", "Account Exec", "PM"],
      };
    case "x":
      return {
        sentiment: +(0.2 + Math.random() * 0.5).toFixed(2),
        competitorMentions: ["Acme Co", "Globex", "Initech"],
      };
    case "news":
      return {
        headlines: [
          `${company} announces Series C`,
          `${company} hires new CRO`,
          `${company} launches AI feature`,
        ],
      };
    default:
      return {};
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
