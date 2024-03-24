import { and, desc, eq, gt, sql } from "drizzle-orm";
import * as data from "../data";
import { EventTypes } from "./events";

export const getJobActivityByJobId = async (params: {
  clusterId: string;
  jobId?: string;
  deploymentId?: string;
}) => {
  const andCondition = [eq(data.events.cluster_id, params.clusterId)];

  if (params.jobId) {
    andCondition?.push(eq(data.events.job_id, params.jobId));
  }
  if (params.deploymentId) {
    andCondition?.push(eq(data.events.deployment_id, params.deploymentId));
  }

  const result = await data.db
    .select({
      type: data.events.type,
      service: data.events.service,
      deploymentId: data.events.deployment_id,
      machineId: data.events.machine_id,
      timestamp: data.events.created_at,
      meta: data.events.meta,
    })
    .from(data.events)
    .where(and(...andCondition))
    .orderBy(desc(data.events.created_at));

  return result;
};

export const getFunctionMetrics = async (query: {
  clusterId: string;
  service: string;
}): Promise<{
  summary: Array<{
    targetFn: string;
    resultType: string;
    count: number;
    avgExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
  }>;
  timeseries: Array<{
    timeBin: string;
    serviceName: string;
    avgExecutionTime: number;
    totalJobResulted: number;
    totalJobStalled: number;
    rejectionCount: number;
  }>;
}> => {
  const summary = await data.db
    .select({
      avgExecutionTime: sql<string>`round(avg((meta->>'functionExecutionTime')::numeric), 2)`,
      maxExecutionTime: sql<string>`max((meta->>'functionExecutionTime')::numeric)`,
      minExecutionTime: sql<string>`min((meta->>'functionExecutionTime')::numeric)`,
      count: sql<string>`count(distinct job_id)`,
      resultType: sql<string>`meta->>'resultType'`,
      targetFn: sql<string>`meta->>'targetFn'`,
    })
    .from(data.events)
    .where(
      and(
        eq(data.events.cluster_id, query.clusterId),
        eq(data.events.service, query.service),
        gt(data.events.created_at, sql`now() - interval '7 days'`),
        eq(data.events.type, "jobResulted" as EventTypes),
      ),
    )
    .groupBy(sql`meta->>'targetFn'`, sql`meta->>'resultType'`);

  const timeseries = await data.db
    .select({
      timeBin: sql<string>`date_bin(INTERVAL '1 minute', created_at, TIMESTAMPTZ '2024-01-01')`,
      serviceName: sql<string>`service`,
      avgExecutionTime: sql<string>`avg((meta ->> 'functionExecutionTime')::numeric)`,
      totalJobResulted: sql<string>`count(case when "type" = 'jobResulted' then 1 end)`,
      totalJobStalled: sql<string>`count(case when "type" = 'jobStalled' then 1 end)`,
      rejectionCount: sql<string>`count(case when meta ->> 'resultType' = 'rejection' then 1 end)`,
    })
    .from(data.events)
    .where(
      and(
        eq(data.events.cluster_id, query.clusterId),
        eq(data.events.service, query.service),
        gt(data.events.created_at, sql`now() - interval '7 days'`),
      ),
    )
    .groupBy(
      sql`date_bin(INTERVAL '1 minute', created_at, TIMESTAMPTZ '2024-01-01')`,
      sql`service`,
    );

  return {
    summary: summary.map((r) => ({
      targetFn: r.targetFn,
      resultType: r.resultType,
      count: parseInt(r.count),
      avgExecutionTime: parseFloat(r.avgExecutionTime),
      minExecutionTime: parseFloat(r.minExecutionTime),
      maxExecutionTime: parseFloat(r.maxExecutionTime),
    })),
    timeseries: timeseries.map((r) => ({
      timeBin: r.timeBin,
      serviceName: r.serviceName,
      avgExecutionTime: parseFloat(r.avgExecutionTime),
      totalJobResulted: parseInt(r.totalJobResulted),
      totalJobStalled: parseInt(r.totalJobStalled),
      rejectionCount: parseInt(r.rejectionCount),
    })),
  };
};
