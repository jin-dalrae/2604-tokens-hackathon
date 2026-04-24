import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import { getJob } from "@/lib/jobs";
import { cdpReady, getFacilitator, UNLOCK_NETWORK } from "@/lib/adapters/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default recipient address (configurable via env). Using the burn address as
// a safe placeholder for the hackathon demo — real deployments should set
// X402_RECEIVER to a CDP-controlled wallet.
const PAY_TO = (process.env.X402_RECEIVER || "0x000000000000000000000000000000000000dead") as `0x${string}`;

// Protected handler: only runs after the client provides a valid X-PAYMENT
// header verified by the facilitator. Returns the deep-research payload.
async function handler(req: NextRequest): Promise<NextResponse<unknown>> {
  const url = new URL(req.url);
  const id = url.pathname.split("/").filter(Boolean).pop();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const job = getJob(id);
  if (!job || !job.insight) {
    return NextResponse.json({ error: "report not ready" }, { status: 404 });
  }
  return NextResponse.json({
    id,
    deep: {
      contradictions: job.insight.contradictions,
      keyPeople: job.insight.keyPeople,
      competitors: job.insight.competitors,
      sources: job.insight.sources,
    },
  });
}

// If CDP keys are present, wrap with real x402 + CDP facilitator.
// Otherwise export the bare handler so local dev still works.
const facilitator = getFacilitator();

export const GET = facilitator
  ? withX402(
      handler,
      PAY_TO,
      {
        price: "$1.00",
        network: UNLOCK_NETWORK,
        config: {
          description: "SuperBrain — unlock deep research (contradictions, people, sources)",
        },
      },
      facilitator,
      {
        appName: "SuperBrain",
      },
    )
  : handler;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT",
    },
  });
}

// silence unused-var lint for cdpReady import
export const __cdpReady = cdpReady;
