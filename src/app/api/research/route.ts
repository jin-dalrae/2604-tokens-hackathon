import { NextResponse } from "next/server";
import { createJob } from "@/lib/jobs";
import { runAgent } from "@/lib/orchestrator";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { company?: string };
  const company = body.company?.trim();
  if (!company) return NextResponse.json({ error: "company required" }, { status: 400 });

  const job = createJob(company);
  const origin = new URL(req.url).origin;
  // fire-and-forget — SSE stream delivers progress
  void runAgent(job.id, origin);
  return NextResponse.json({ id: job.id });
}
