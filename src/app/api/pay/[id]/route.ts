import { NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/jobs";
import { settle, UNLOCK_PRICE_USDC } from "@/lib/adapters/x402";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { payer?: string; signature?: string };
  const payer = body.payer ?? "demo-wallet";
  const signature = body.signature ?? `sim_${Math.random().toString(36).slice(2, 10)}`;

  try {
    const receipt = await settle(id, payer, signature);
    updateJob(id, { paid: true });
    return NextResponse.json({ ok: true, receipt, price: UNLOCK_PRICE_USDC });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "payment failed" },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ price: UNLOCK_PRICE_USDC, currency: "USDC" });
}
