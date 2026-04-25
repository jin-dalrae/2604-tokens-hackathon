import { NextResponse } from "next/server";
import { getOrCreateJob } from "@/lib/jobs";
import { runAgent } from "@/lib/orchestrator";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { company?: string };
  const company = body.company?.trim();
  if (!company) return NextResponse.json({ error: "company required" }, { status: 400 });

  const { job, reused, wasReset } = getOrCreateJob(company);
  const origin = new URL(req.url).origin;

  // Re-run if the job was reset (a previous done/error run for the same
  // company), OR if it's brand-new. Don't double-fire when one is already
  // running for the same slug — the user just rejoins the live stream.
  const shouldRun = wasReset || !reused;
  if (shouldRun) {
    void runAgent(job.id, origin);
  }

  return NextResponse.json({
    id: job.id,
    company: job.company,
    reused,
    wasReset,
    rerunning: shouldRun && reused,
  });
}
