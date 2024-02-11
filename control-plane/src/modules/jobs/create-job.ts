import { and, desc, eq, gte } from "drizzle-orm";
import { ulid } from "ulid";
import * as data from "../data";
import * as events from "../observability/events";
import { functionDefinition } from "../service-definitions";

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
  pool?: string;
  idempotencyKey?: string;
  cacheKey?: string;
}) => {
  const serviceDefinition = await functionDefinition(
    params.owner,
    params.service,
    params.targetFn,
  );

  const retryParams = {
    timeoutIntervalSeconds: serviceDefinition?.timeoutIntervalSeconds,
    maxAttempts: serviceDefinition?.maxAttempts,
  };

  if (params.idempotencyKey) {
    const idempotencyParams = {
      ...params,
      ...retryParams,
      idempotencyKey: params.idempotencyKey,
    };

    const { id } = await createJobStrategies.idempotence({
      ...idempotencyParams,
      idempotencyKey: params.idempotencyKey,
    });

    onAfterJobCreated({
      ...idempotencyParams,
      jobId: id,
    });

    return { id };
  } else if (params.cacheKey) {
    const { id } = await createJobStrategies.cached({
      ...params,
      ...retryParams,
      cacheKey: params.cacheKey,
    });

    onAfterJobCreated({
      ...params,
      jobId: id,
    });

    return { id };
  } else {
    const { id } = await createJobStrategies.default({
      ...params,
      ...retryParams,
    });

    onAfterJobCreated({
      ...params,
      ...retryParams,
      jobId: id,
    });

    return { id };
  }
};

const createJobStrategies = {
  idempotence: async ({
    service,
    targetFn,
    targetArgs,
    owner,
    deploymentId,
    pool,
    idempotencyKey,
    timeoutIntervalSeconds,
    maxAttempts,
  }: CreateJobParams & { idempotencyKey: string }) => {
    const jobId = idempotencyKey;

    await data.db
      .insert(data.jobs)
      .values({
        id: idempotencyKey,
        target_fn: targetFn,
        target_args: targetArgs,
        idempotency_key: jobId,
        status: "pending",
        owner_hash: owner.clusterId,
        deployment_id: deploymentId,
        machine_type: pool,
        service,
        remaining_attempts: maxAttempts ?? 1,
        timeout_interval_seconds: timeoutIntervalSeconds,
      })
      .onConflictDoNothing();

    return { id: jobId };
  },
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
  }: CreateJobParams & { cacheKey: string }) => {
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
      idempotency_key: jobId,
      status: "pending",
      owner_hash: owner.clusterId,
      deployment_id: deploymentId,
      machine_type: pool,
      service,
      cache_key: cacheKey,
      remaining_attempts: maxAttempts ?? 1,
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
  }: CreateJobParams) => {
    const jobId = ulid();

    await data.db.insert(data.jobs).values({
      id: jobId,
      target_fn: targetFn,
      target_args: targetArgs,
      idempotency_key: jobId,
      status: "pending",
      owner_hash: owner.clusterId,
      deployment_id: deploymentId,
      machine_type: pool,
      service,
      remaining_attempts: maxAttempts ?? 1,
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
