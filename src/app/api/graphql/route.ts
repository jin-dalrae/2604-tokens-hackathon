import { createYoga } from "graphql-yoga";
import { schema } from "@/lib/graphql/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  landingPage: false,
});

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
