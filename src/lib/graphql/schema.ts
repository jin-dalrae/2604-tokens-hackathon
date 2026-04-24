import { buildSubgraphSchema } from "@apollo/subgraph";
import { parse } from "graphql";
import type { Job, CompanyInsight } from "../types";
import { getJob, jobsIterator } from "../jobs";

// Apollo Federation v2 subgraph schema — registered with Wundergraph Cosmo
// so any agent can query the knowledge we gathered.
const typeDefs = parse(/* GraphQL */ `
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.5", import: ["@key", "@shareable"])

  type Query {
    company(id: ID!): Company
    companyByName(name: String!): Company
    companies: [Company!]!
  }

  type Company @key(fields: "id") {
    id: ID!
    name: String!
    tagline: String!
    summary: String!
    generatedAt: String!
    officialClaims: [String!]!
    publicSentiment: Sentiment!
    employeeTrend: EmployeeTrend!
    keyPeople: [Person!]!
    competitors: [Competitor!]!
    contradictions: [Contradiction!]!
    sources: [Source!]!
  }

  type Sentiment @shareable {
    score: Float!
    trend: String!
    sampleMentions: [String!]!
  }

  type EmployeeTrend @shareable {
    headcount: Int!
    growth30d: Float!
    signal: String!
  }

  type Person @shareable {
    name: String!
    role: String!
    linkedinUrl: String
  }

  type Competitor @shareable {
    name: String!
    overlap: String!
    strength: Float!
  }

  type Contradiction @shareable {
    claim: String!
    officialSource: String!
    counterEvidence: String!
    counterSource: String!
  }

  type Source @shareable {
    url: String!
    title: String!
    kind: String!
    fetchedAt: String!
    excerpt: String
  }
`);

const resolvers = {
  Query: {
    company: (_: unknown, args: { id: string }) => insightOf(getJob(args.id)),
    companyByName: (_: unknown, args: { name: string }) => {
      for (const j of allJobs()) {
        if (j.insight && j.insight.name.toLowerCase() === args.name.toLowerCase()) {
          return j.insight;
        }
      }
      return null;
    },
    companies: () =>
      allJobs()
        .map((j) => j.insight)
        .filter((i): i is CompanyInsight => Boolean(i)),
  },
  Company: {
    __resolveReference: (ref: { id: string }) => insightOf(getJob(ref.id)),
  },
};

function allJobs(): Job[] {
  return Array.from(jobsIterator());
}

function insightOf(job: Job | undefined): CompanyInsight | null {
  return job?.insight ?? null;
}

export const schema = buildSubgraphSchema({ typeDefs, resolvers });
