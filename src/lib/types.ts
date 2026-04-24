import { z } from "zod";

export const SourceSchema = z.object({
  url: z.url(),
  title: z.string(),
  kind: z.enum(["website", "linkedin", "x", "news", "other"]),
  fetchedAt: z.string(),
  excerpt: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const PersonSchema = z.object({
  name: z.string(),
  role: z.string(),
  linkedinUrl: z.url().optional(),
});
export type Person = z.infer<typeof PersonSchema>;

export const CompetitorSchema = z.object({
  name: z.string(),
  overlap: z.string(),
  strength: z.number().min(0).max(1),
});
export type Competitor = z.infer<typeof CompetitorSchema>;

export const ContradictionSchema = z.object({
  claim: z.string(),
  officialSource: z.url(),
  counterEvidence: z.string(),
  counterSource: z.url(),
});
export type Contradiction = z.infer<typeof ContradictionSchema>;

export const CompanyInsightSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  summary: z.string(),
  officialClaims: z.array(z.string()),
  publicSentiment: z.object({
    score: z.number().min(-1).max(1),
    trend: z.enum(["up", "down", "flat"]),
    sampleMentions: z.array(z.string()),
  }),
  employeeTrend: z.object({
    headcount: z.number(),
    growth30d: z.number(),
    signal: z.enum(["hiring", "stable", "layoffs", "unknown"]),
  }),
  keyPeople: z.array(PersonSchema),
  competitors: z.array(CompetitorSchema),
  contradictions: z.array(ContradictionSchema),
  sources: z.array(SourceSchema),
  generatedAt: z.string(),
});
export type CompanyInsight = z.infer<typeof CompanyInsightSchema>;

export type AgentEventKind =
  | "queued"
  | "browse"
  | "extract"
  | "memory"
  | "synthesize"
  | "publish"
  | "done"
  | "error";

export interface AgentEvent {
  id: string;
  jobId: string;
  kind: AgentEventKind;
  label: string;
  detail?: string;
  sourceUrl?: string;
  at: string;
}

export interface Job {
  id: string;
  company: string;
  status: "queued" | "running" | "done" | "error";
  events: AgentEvent[];
  insight?: CompanyInsight;
  paid: boolean;
  createdAt: string;
  ghostUrl?: string;
  ghostExternal?: boolean;
  sensoUrl?: string;
}
