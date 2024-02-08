import { and, eq, sql } from "drizzle-orm";
import * as cluster from "../cluster";
import * as data from "../data";
import * as events from "../observability/events";
import * as predictor from "../predictor/predictor";

type PersistResultParams = {
  result: string;
  resultType: "resolution" | "rejection";
  functionExecutionTime?: number;
  jobId: string;
  owner: { clusterId: string };
  machineId: string;
};

export async function persistJobResult({
  result,
  resultType,
  functionExecutionTime,
  jobId,
  owner,
  machineId,
}: PersistResultParams) {
  // TODO: this should be one query. The reason it's not is because
  // we haven't established the foreign key relationship between the jobs table and the clusters table
  // and we can't do that without undoing a bunch of patterns that use the jobs table
  // as a standalong key-value store
  const [predictiveRetriesEnabled, [job]] = await Promise.all([
    cluster
      .operationalCluster(owner.clusterId)
      .then((c) => c?.predictiveRetriesEnabled),
    data.db
      .select({
        remainingAttempts: data.jobs.remaining_attempts,
        service: data.jobs.service,
        targetFn: data.jobs.target_fn,
      })
      .from(data.jobs)
      .where(
        and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId)),
      ),
  ]);

  events.write({
    type: "jobResulted",
    service: job.service,
    clusterId: owner.clusterId,
    jobId,
    machineId,
    meta: {
      targetFn: job.targetFn,
      result,
      resultType,
      functionExecutionTime,
    },
  });

  const mustRetryPredictively =
    resultType === "rejection" && predictiveRetriesEnabled;

  const hasRemainingAttempts = (job.remainingAttempts ?? 0) > 0;

  if (mustRetryPredictively && hasRemainingAttempts) {
    const retryable = await predictor.isRetryable(result);

    if (retryable.retryable) {
      await persistJobResultStrategies.predictedRetryable({
        result,
        resultType,
        functionExecutionTime,
        jobId,
        owner,
        machineId,
        service: job.service,
      });
    } else {
      await persistJobResultStrategies.predictedNotRetryable({
        result,
        resultType,
        functionExecutionTime,
        jobId,
        owner,
        machineId,
        service: job.service,
        reason: retryable.reason,
      });
    }
  } else {
    await persistJobResultStrategies.default({
      result,
      resultType,
      functionExecutionTime,
      jobId,
      owner,
      machineId,
    });
  }
}

const persistJobResultStrategies = {
  predictedRetryable: async ({
    result,
    resultType,
    functionExecutionTime,
    jobId,
    owner,
    machineId,
    service,
  }: PersistResultParams & { service: string }) => {
    events.write({
      type: "predictorRetryableResult",
      service,
      clusterId: owner.clusterId,
      jobId,
      machineId,
      meta: {
        retryable: true,
      },
    });

    const updateResult = await data.db
      .update(data.jobs)
      .set({
        status: "pending",
        remaining_attempts: sql`remaining_attempts - 1`,
        result,
        result_type: resultType,
        resulted_at: sql`now()`,
        function_execution_time_ms: functionExecutionTime,
      })
      .where(
        and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId)),
      );
  },
  predictedNotRetryable: async ({
    result,
    resultType,
    functionExecutionTime,
    jobId,
    owner,
    machineId,
    service,
    reason,
  }: PersistResultParams & { service: string; reason?: string }) => {
    events.write({
      type: "predictorRetryableResult",
      service,
      clusterId: owner.clusterId,
      jobId,
      machineId,
      meta: {
        retryable: false,
        reason,
      },
    });

    const updateResult = await data.db
      .update(data.jobs)
      .set({
        result,
        result_type: resultType,
        resulted_at: sql`now()`,
        function_execution_time_ms: functionExecutionTime,
        status: "success",
      })
      .where(
        and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId)),
      )
      .returning({ service: data.jobs.service, targetFn: data.jobs.target_fn });
  },
  default: async ({
    result,
    resultType,
    functionExecutionTime,
    jobId,
    owner,
    machineId,
  }: PersistResultParams) => {
    const updateResult = await data.db
      .update(data.jobs)
      .set({
        result,
        result_type: resultType,
        resulted_at: sql`now()`,
        function_execution_time_ms: functionExecutionTime,
        status: "success",
      })
      .where(
        and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId)),
      )
      .returning({ service: data.jobs.service, targetFn: data.jobs.target_fn });
  },
};
