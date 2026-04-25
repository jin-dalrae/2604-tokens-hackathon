import { nanoid } from "nanoid";
import type { AgentEvent, Job } from "./types";

// In-memory job + event store with pub/sub. Good enough for hackathon demo;
// swap to Redis Streams when we wire the real Redis adapter.
//
// Job IDs are derived from the company name (slugified) so re-asking about
// the same company updates the existing page rather than creating duplicates.
const jobs = new Map<string, Job>();
const subscribers = new Map<string, Set<(e: AgentEvent) => void>>();

export function slugifyCompany(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || `co-${nanoid(6)}`
  );
}

/**
 * Create a job for a company OR reset an existing one for re-research.
 * - If no job exists for the slug → create new
 * - If a job exists and is "running" → return it (caller should redirect to watch)
 * - If a job exists and is "done"/"error" → reset events + status, return it (caller should re-run)
 */
export function getOrCreateJob(company: string): { job: Job; reused: boolean; wasReset: boolean } {
  const id = slugifyCompany(company);
  const existing = jobs.get(id);

  if (existing) {
    if (existing.status === "running" || existing.status === "queued") {
      return { job: existing, reused: true, wasReset: false };
    }
    // Reset for re-run while keeping the same id (URL stays stable).
    existing.status = "queued";
    existing.events = [];
    existing.insight = undefined;
    existing.paid = false;
    existing.ghostUrl = undefined;
    existing.ghostExternal = undefined;
    existing.sensoUrl = undefined;
    existing.company = company; // refresh casing
    existing.createdAt = new Date().toISOString();
    return { job: existing, reused: true, wasReset: true };
  }

  const job: Job = {
    id,
    company,
    status: "queued",
    events: [],
    paid: false,
    createdAt: new Date().toISOString(),
  };
  jobs.set(id, job);
  subscribers.set(id, new Set());
  return { job, reused: false, wasReset: false };
}

// Back-compat alias for any callers still using the old name.
export function createJob(company: string): Job {
  return getOrCreateJob(company).job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<Job>): Job | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  Object.assign(job, patch);
  return job;
}

export function emit(jobId: string, event: Omit<AgentEvent, "id" | "jobId" | "at">): AgentEvent {
  const job = jobs.get(jobId);
  const full: AgentEvent = {
    ...event,
    id: nanoid(8),
    jobId,
    at: new Date().toISOString(),
  };
  if (job) job.events.push(full);
  const subs = subscribers.get(jobId);
  if (subs) for (const fn of subs) fn(full);
  return full;
}

export function jobsIterator(): IterableIterator<Job> {
  return jobs.values();
}

export function subscribe(jobId: string, fn: (e: AgentEvent) => void): () => void {
  let set = subscribers.get(jobId);
  if (!set) {
    set = new Set();
    subscribers.set(jobId, set);
  }
  set.add(fn);
  return () => set?.delete(fn);
}
