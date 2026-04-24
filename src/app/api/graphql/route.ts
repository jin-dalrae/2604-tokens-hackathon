import { parse, validate, execute } from "graphql";
import { schema } from "@/lib/graphql/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request): Promise<Response> {
  try {
    let query: string | undefined;
    let variables: Record<string, unknown> | undefined;
    let operationName: string | undefined;

    if (req.method === "GET") {
      const url = new URL(req.url);
      query = url.searchParams.get("query") ?? undefined;
      const vars = url.searchParams.get("variables");
      if (vars) variables = JSON.parse(vars);
      operationName = url.searchParams.get("operationName") ?? undefined;
    } else {
      const body = (await req.json().catch(() => ({}))) as {
        query?: string;
        variables?: Record<string, unknown>;
        operationName?: string;
      };
      query = body.query;
      variables = body.variables;
      operationName = body.operationName;
    }

    if (!query) {
      return Response.json({ errors: [{ message: "query required" }] }, { status: 400 });
    }

    const doc = parse(query);
    const validationErrors = validate(schema, doc);
    if (validationErrors.length) {
      return Response.json({ errors: validationErrors.map((e) => ({ message: e.message })) }, { status: 400 });
    }
    const result = await execute({
      schema,
      document: doc,
      variableValues: variables,
      operationName,
    });
    return Response.json(result, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return Response.json(
      { errors: [{ message: err instanceof Error ? err.message : "graphql error" }] },
      { status: 400 },
    );
  }
}

function cors() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export { handle as GET, handle as POST };
export { cors as OPTIONS };
