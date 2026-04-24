import { NextResponse } from "next/server";
import { jobsIterator } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = Array.from(jobsIterator())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((j) => ({
      id: j.id,
      company: j.company,
      status: j.status,
      createdAt: j.createdAt,
      ghostUrl: j.ghostUrl,
      ghostExternal: j.ghostExternal,
      sensoUrl: j.sensoUrl,
    }));
  return NextResponse.json({ jobs });
}
