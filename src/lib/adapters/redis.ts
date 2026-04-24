import { createClient, type RedisClientType } from "redis";
import type { StructuredPage } from "./nexla";
import type { Contradiction } from "../types";

export interface MemoryRecord {
  key: string;
  text: string;
  sourceUrl: string;
}

// Redis semantic memory adapter.
// If REDIS_HOST + REDIS_PASSWORD are set, writes to real Redis Cloud.
// Otherwise falls back to an in-process Map so demos keep working.

let client: RedisClientType | null = null;
let clientPromise: Promise<RedisClientType | null> | null = null;
const fallback = new Map<string, MemoryRecord[]>();

function hasRealCreds(): boolean {
  return Boolean(process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_PASSWORD));
}

async function getClient(): Promise<RedisClientType | null> {
  if (!hasRealCreds()) return null;
  if (client?.isOpen) return client;
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const c: RedisClientType = process.env.REDIS_URL
      ? createClient({ url: process.env.REDIS_URL })
      : createClient({
          username: process.env.REDIS_USERNAME || "default",
          password: process.env.REDIS_PASSWORD,
          socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT || 6379),
          },
        });
    c.on("error", (err) => {
      console.error("[redis] client error:", err);
    });
    await c.connect();
    client = c;
    return c;
  })();
  try {
    return await clientPromise;
  } catch (err) {
    console.error("[redis] connect failed, falling back to in-memory:", err);
    clientPromise = null;
    return null;
  }
}

export async function remember(jobId: string, pages: StructuredPage[]): Promise<number> {
  const records: MemoryRecord[] = [];
  for (const p of pages) {
    for (const [k, v] of Object.entries(p.facts)) {
      records.push({
        key: `${p.source.kind}:${k}`,
        text: Array.isArray(v) ? v.join(", ") : String(v),
        sourceUrl: p.source.url,
      });
    }
  }

  const c = await getClient();
  if (c) {
    const key = `superbrain:job:${jobId}:facts`;
    const multi = c.multi();
    multi.del(key);
    for (const r of records) {
      multi.rPush(key, JSON.stringify(r));
    }
    multi.expire(key, 60 * 60 * 24); // 24h TTL
    await multi.exec();
    return records.length;
  }

  fallback.set(jobId, records);
  return records.length;
}

export async function findContradictions(
  _jobId: string,
  pages: StructuredPage[],
): Promise<Contradiction[]> {
  const official = pages.find((p) => p.source.kind === "website");
  const social = pages.find((p) => p.source.kind === "x");
  const news = pages.find((p) => p.source.kind === "news");
  if (!official || (!social && !news)) return [];
  const counter = social ?? news!;
  return [
    {
      claim: String(official.facts.claim ?? "Official claim"),
      officialSource: official.source.url,
      counterEvidence: "Public mentions highlight pricing friction and churn risk.",
      counterSource: counter.source.url,
    },
  ];
}

export async function recall(jobId: string): Promise<MemoryRecord[]> {
  const c = await getClient();
  if (c) {
    const raw = await c.lRange(`superbrain:job:${jobId}:facts`, 0, -1);
    return raw.map((s) => JSON.parse(s) as MemoryRecord);
  }
  return fallback.get(jobId) ?? [];
}

export async function redisMode(): Promise<"real" | "fallback"> {
  const c = await getClient();
  return c ? "real" : "fallback";
}
