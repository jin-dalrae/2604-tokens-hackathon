import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";
import { receiptFor } from "@/lib/adapters/x402";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  const paid = job.paid || Boolean(receiptFor(id));
  return NextResponse.json({
    id: job.id,
    company: job.company,
    status: job.status,
    events: job.events,
    insight: job.insight,
    paid,
    ghostUrl: job.ghostUrl,
    ghostExternal: job.ghostExternal,
    sensoUrl: job.sensoUrl,
  });
}
