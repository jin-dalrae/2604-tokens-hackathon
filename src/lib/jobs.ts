import { nanoid } from "nanoid";
import type { AgentEvent, Job } from "./types";

// In-memory job + event store with pub/sub. Good enough for hackathon demo;
// swap to Redis Streams when we wire the real Redis adapter.
const jobs = new Map<string, Job>();
const subscribers = new Map<string, Set<(e: AgentEvent) => void>>();

export function createJob(company: string): Job {
  const id = nanoid(10);
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
  return job;
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
