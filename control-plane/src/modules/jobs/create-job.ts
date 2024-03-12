import { and, desc, eq, gte } from "drizzle-orm";
import { ulid } from "ulid";
import * as clusters from "../cluster";
import * as data from "../data";
import * as events from "../observability/events";
import { functionDefinition } from "../service-definitions";
import { jobDurations } from "./job-metrics";

type CreateJobParams = {
  service: string;
  targetFn: string;
  targetArgs: string;
  owner: { clusterId: string };
  deploymentId?: string;
  pool?: string;
  timeoutIntervalSeconds?: number;
  maxAttempts?: number;
};

export const createJob = async (params: {
  service: string;
  targetFn: string;
  targetArgs: string;
  owner: { clusterId: string };
  deploymentId?: string;
  cacheKey?: string;
}) => {
  const end = jobDurations.startTimer({ operation: "createJob" });

  const serviceDefinition = await functionDefinition(
    params.owner,
    params.service,
    params.targetFn,
  );

  const cluster = await clusters.operationalCluster(params.owner.clusterId);

  const retryParams = {
    timeoutIntervalSeconds: serviceDefinition?.timeoutIntervalSeconds,
    maxAttempts: serviceDefinition?.maxAttempts,
  };

  if (params.cacheKey) {
    const { id } = await createJobStrategies.cached({
      ...params,
      ...retryParams,
      cacheKey: params.cacheKey,
      cluster,
    });

    onAfterJobCreated({
      ...params,
      jobId: id,
    });

    end();
    return { id };
  } else {
    const { id } = await createJobStrategies.default({
      ...params,
      ...retryParams,
      cluster,
    });

    onAfterJobCreated({
      ...params,
      ...retryParams,
      jobId: id,
    });

    end();
    return { id };
  }
};

const createJobStrategies = {
  cached: async ({
    service,
    targetFn,
    targetArgs,
    owner,
    deploymentId,
    pool,
    cacheKey,
    timeoutIntervalSeconds,
    maxAttempts,
    cluster,
  }: CreateJobParams & {
    cacheKey: string;
    cluster: clusters.OperationalCluster;
  }) => {
    const cacheTTL = await functionDefinition(owner, service, targetFn)
      .then((d) => d?.cacheTTL ?? 0)
      .catch(() => 0); // on error, just don't cache

    // has a job been completed within the TTL?
    // if so, return the jobId

    const [job] = await data.db
      .select({
        id: data.jobs.id,
      })
      .from(data.jobs)
      .where(
        and(
          eq(data.jobs.cache_key, cacheKey),
          eq(data.jobs.owner_hash, owner.clusterId),
          eq(data.jobs.service, service),
          eq(data.jobs.target_fn, targetFn),
          eq(data.jobs.status, "success"),
          eq(data.jobs.result_type, "resolution"),
          gte(data.jobs.resulted_at, new Date(Date.now() - cacheTTL)),
        ),
      )
      .orderBy(desc(data.jobs.resulted_at))
      .limit(1);

    if (job) {
      return { id: job.id };
    }

    // if not, create a job
    const jobId = ulid();

    await data.db.insert(data.jobs).values({
      id: jobId,
      target_fn: targetFn,
      target_args: targetArgs,
      status: "pending",
      owner_hash: owner.clusterId,
      deployment_id: deploymentId,
      service,
      cache_key: cacheKey,
      remaining_attempts:
        maxAttempts ?? (cluster.autoRetryStalledJobsEnabled ? 2 : 1),
      timeout_interval_seconds: timeoutIntervalSeconds,
    });

    return { id: jobId };
  },
  default: async ({
    service,
    targetFn,
    targetArgs,
    owner,
    deploymentId,
    pool,
    timeoutIntervalSeconds,
    maxAttempts,
    cluster,
  }: CreateJobParams & { cluster: clusters.OperationalCluster }) => {
    const jobId = ulid();

    await data.db.insert(data.jobs).values({
      id: jobId,
      target_fn: targetFn,
      target_args: targetArgs,
      status: "pending",
      owner_hash: owner.clusterId,
      deployment_id: deploymentId,
      service,
      remaining_attempts:
        maxAttempts ?? (cluster.autoRetryStalledJobsEnabled ? 2 : 1),
      timeout_interval_seconds: timeoutIntervalSeconds,
    });

    return { id: jobId };
  },
};

const onAfterJobCreated = async ({
  service,
  targetFn,
  targetArgs,
  owner,
  jobId,
}: CreateJobParams & { jobId: string }) => {
  events.write({
    type: "jobCreated",
    clusterId: owner.clusterId,
    jobId,
    meta: {
      targetFn,
      service,
      targetArgs,
    },
  });
};
