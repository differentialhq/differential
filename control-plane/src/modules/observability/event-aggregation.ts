import { and, desc, eq, sql } from "drizzle-orm";
import * as data from "../data";
import { EventTypes } from "./events";

export const getJobActivityByJobId = async (params: {
  clusterId: string;
  jobId: string;
}) => {
  const result = await data.db
    .select({
      type: data.events.type,
      service: data.events.service,
      jobId: data.events.job_id,
      machineId: data.events.machine_id,
      timestamp: data.events.created_at,
      meta: data.events.meta,
    })
    .from(data.events)
    .where(
      and(
        eq(data.events.cluster_id, params.clusterId),
        eq(data.events.job_id, params.jobId),
      ),
    )
    .orderBy(desc(data.events.created_at));

  return result;
};

export const getFunctionMetrics = async (query: {
  clusterId: string;
  service: string;
  targetFn: string;
}): Promise<{
  success: {
    count: number;
    avgExecutionTime: number | null;
    minExecutionTime: number | null;
    maxExecutionTime: number | null;
  };
  failure: {
    count: number;
    avgExecutionTime: number | null;
    minExecutionTime: number | null;
    maxExecutionTime: number | null;
  };
}> => {
  const result = await data.db
    .select({
      avgExecutionTime: sql<string>`round(avg((meta->>'functionExecutionTime')::numeric), 2)`,
      maxExecutionTime: sql<string>`max((meta->>'functionExecutionTime')::numeric)`,
      minExecutionTime: sql<string>`min((meta->>'functionExecutionTime')::numeric)`,
      resultType: sql<string>`meta->>'resultType'`,
      count: sql<string>`count(distinct job_id)`,
    })
    .from(data.events)
    .where(
      and(
        eq(data.events.cluster_id, query.clusterId),
        eq(data.events.service, query.service),
        eq(data.events.type, "jobResulted" as EventTypes),
        sql`meta->>'targetFn' = ${query.targetFn}`,
      ),
    )
    .groupBy(sql`meta->>'resultType'`);

  console.log({ result });

  const success = result.find((x) => x.resultType === "resolution");
  const failure = result.find((x) => x.resultType === "rejection");

  return {
    success: {
      count: success ? Number(success.count) : 0,
      avgExecutionTime: success ? Number(success.avgExecutionTime) : null,
      minExecutionTime: success ? Number(success.minExecutionTime) : null,
      maxExecutionTime: success ? Number(success.maxExecutionTime) : null,
    },
    failure: {
      count: failure ? Number(failure.count) : 0,
      avgExecutionTime: failure ? Number(failure.avgExecutionTime) : null,
      minExecutionTime: failure ? Number(failure.minExecutionTime) : null,
      maxExecutionTime: failure ? Number(failure.maxExecutionTime) : null,
    },
  };
};
