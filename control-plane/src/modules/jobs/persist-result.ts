import { and, eq, gt, isNotNull, lt, sql } from "drizzle-orm";
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
  const shouldPredictRetry =
    resultType === "rejection" &&
    (await cluster
      .operationalCluster(owner.clusterId)
      .then((c) => c?.predictiveRetriesEnabled ?? false));

  const predictedToBeRetryableResult = shouldPredictRetry
    ? await predictor.isRetryable(result)
    : null;

  const updateResult = predictedToBeRetryableResult
    ? await updateJobWithRetryableResult({
        result,
        resultType,
        functionExecutionTime,
        predictedToBeRetryableResult,
        jobId,
        owner,
        machineId,
      })
    : await updateJobWithoutRetryableResult({
        result,
        resultType,
        functionExecutionTime,
        jobId,
        owner,
        machineId,
      });

  events.write({
    type: "jobResulted",
    service: updateResult[0]?.service,
    clusterId: owner.clusterId,
    jobId,
    machineId,
    meta: {
      targetFn: updateResult[0]?.targetFn,
      result,
      resultType,
      functionExecutionTime,
    },
  });

  if (predictedToBeRetryableResult) {
    events.write(
      {
        type: "predictorRetryableResult",
        service: updateResult[0]?.service,
        clusterId: owner.clusterId,
        jobId,
        machineId,
        meta: {
          retryable: predictedToBeRetryableResult.retryable,
          reason: predictedToBeRetryableResult.reason,
        },
      },
      1,
    );
  }
}

async function updateJobWithRetryableResult({
  result,
  resultType,
  functionExecutionTime,
  predictedToBeRetryableResult,
  jobId,
  owner,
}: PersistResultParams & {
  predictedToBeRetryableResult: predictor.PredictedRetryableResult;
}) {
  return await data.db
    .update(data.jobs)
    .set({
      result,
      result_type: resultType,
      resulted_at: sql`now()`,
      function_execution_time_ms: functionExecutionTime,
      status: predictedToBeRetryableResult.retryable ? "pending" : "success",
      predicted_to_be_retryable: predictedToBeRetryableResult.retryable,
      predicted_to_be_retryable_reason: predictedToBeRetryableResult.reason,
    })
    .where(
      and(eq(data.jobs.id, jobId), eq(data.jobs.owner_hash, owner.clusterId)),
    )
    .returning({ service: data.jobs.service, targetFn: data.jobs.target_fn });
}

async function updateJobWithoutRetryableResult({
  result,
  resultType,
  functionExecutionTime,
  jobId,
  owner,
}: PersistResultParams) {
  return await data.db
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
}

export async function selfHealJobs() {
  // TODO: impose a global timeout on jobs that don't have a timeout set
  // TODO: these queries need to be chunked. If there are 100k jobs, we don't want to update them all at once

  // Jobs are failed if they are running and have timed out
  const stalledFailed = await data.db
    .update(data.jobs)
    .set({
      status: "failure",
    })
    .where(
      and(
        eq(data.jobs.status, "running"),
        lt(
          data.jobs.last_retrieved_at,
          sql`now() - interval '1 second' * timeout_interval_seconds`,
        ),
        isNotNull(data.jobs.timeout_interval_seconds), // only timeout jobs that have a timeout set
      ),
    )
    .returning({
      id: data.jobs.id,
      service: data.jobs.service,
      targetFn: data.jobs.target_fn,
      ownerHash: data.jobs.owner_hash,
      remainingAttempts: data.jobs.remaining_attempts,
    });

  const stalledRecovered = await data.db
    .update(data.jobs)
    .set({
      status: "pending",
    })
    .where(
      and(eq(data.jobs.status, "failure"), gt(data.jobs.remaining_attempts, 0)),
    )
    .returning({
      id: data.jobs.id,
      service: data.jobs.service,
      targetFn: data.jobs.target_fn,
      ownerHash: data.jobs.owner_hash,
      remainingAttempts: data.jobs.remaining_attempts,
    });

  stalledFailed.forEach((row) => {
    events.write({
      service: row.service,
      clusterId: row.ownerHash,
      jobId: row.id,
      type: "jobStalled",
      meta: {
        attemptsRemaining: row.remainingAttempts ?? undefined,
      },
    });
  });

  stalledRecovered.forEach((row) => {
    events.write({
      service: row.service,
      clusterId: row.ownerHash,
      jobId: row.id,
      type: "jobRecovered",
    });
  });

  return {
    stalledFailed: stalledFailed.map((row) => row.id),
    stalledRecovered: stalledRecovered.map((row) => row.id),
  };
}
