import { getJob, subscribe } from "@/lib/jobs";
import type { AgentEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) return new Response("job not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      // replay buffered events so late subscribers catch up
      for (const e of job.events) send(e);
      if (job.status === "done" || job.status === "error") {
        controller.close();
        return;
      }
      const unsub = subscribe(id, (e: AgentEvent) => {
        send(e);
        if (e.kind === "done" || e.kind === "error") {
          unsub();
          controller.close();
        }
      });
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
