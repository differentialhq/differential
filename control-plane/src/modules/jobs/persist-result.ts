import { and, eq, gt, isNotNull, lt, lte, sql } from "drizzle-orm";
import * as data from "../data";
import * as events from "../observability/events";
import * as predictor from "../predictor/predictor";
import { jobDurations } from "./job-metrics";
import { NotFoundError } from "../../utilities/errors";

type PersistResultParams = {
  result: string;
  resultType: "resolution" | "rejection";
  functionExecutionTime?: number;
  jobId: string;
  owner: { clusterId: string };
  machineId: string;
  deploymentId?: string;
};

// TODO: this should be configurable at a cluster level
const MAX_PREDICTIVE_RETRIES = 3;

const shouldPredictRetry = async ({
  resultType,
  jobId,
  owner,
}: Pick<PersistResultParams, "resultType" | "jobId" | "owner">) => {
  const isRejected = resultType === "rejection";

  if (!isRejected) {
    return false;
  }

  const jobs = await data.db
    .select({
      jobId: data.jobs.id,
    })
    .from(data.jobs)
    .where(
      and(
        eq(data.jobs.id, jobId),
        eq(data.jobs.owner_hash, owner.clusterId),
        eq(data.jobs.predictive_retry_enabled, true),
        lte(data.jobs.predictive_retry_count, MAX_PREDICTIVE_RETRIES),
      ),
    )
    .limit(1);

  return jobs.length === 1;
};

export async function persistJobResult({
  result,
  resultType,
  functionExecutionTime,
  jobId,
  owner,
  machineId,
  deploymentId,
}: PersistResultParams) {
  const end = jobDurations.startTimer({ operation: "persistJobResult" });

  const shouldCallPredictor = await shouldPredictRetry({
    resultType,
    jobId,
    owner,
  });

  const predictedToBeRetryableResult = shouldCallPredictor
    ? await predictor.isRetryable(result).catch(() => null)
    : null;

  const retryableResults = predictedToBeRetryableResult
    ? {
        status: predictedToBeRetryableResult.retryable
          ? ("pending" as const)
          : ("success" as const),
        predicted_to_be_retryable: predictedToBeRetryableResult.retryable,
        predicted_to_be_retryable_reason: predictedToBeRetryableResult.reason,
        predictive_retry_count: sql`predictive_retry_count + 1`,
      }
    : {
        status: "success" as const,
      };

  const updateResult = await data.db
    .update(data.jobs)
    .set({
      result,
      result_type: resultType,
      resulted_at: sql`now()`,
      function_execution_time_ms: functionExecutionTime,
      ...retryableResults,
    })
    .where(
      and(
        eq(data.jobs.id, jobId),
        eq(data.jobs.owner_hash, owner.clusterId),
        eq(data.jobs.executing_machine_id, machineId),
      ),
    )
    .returning({ service: data.jobs.service, targetFn: data.jobs.target_fn });

  if (updateResult.length === 0) {
    events.write({
      type: "jobResultedButNotPersisted",
      service: updateResult[0]?.service,
      clusterId: owner.clusterId,
      jobId,
      machineId,
      deploymentId,
      meta: {
        targetFn: updateResult[0]?.targetFn,
        result,
        resultType,
        functionExecutionTime,
      },
    });
  } else {
    events.write({
      type: "jobResulted",
      service: updateResult[0]?.service,
      clusterId: owner.clusterId,
      jobId,
      machineId,
      deploymentId,
      meta: {
        targetFn: updateResult[0]?.targetFn,
        result,
        resultType,
        functionExecutionTime,
      },
    });
  }

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

  end();

  return updateResult.length;
}

export async function selfHealJobs(params?: { machineStallTimeout?: number }) {
  // TODO: impose a global timeout on jobs that don't have a timeout set
  // TODO: these queries need to be chunked. If there are 100k jobs, we don't want to update them all at once

  // Jobs are failed if they are running and have timed out
  const stalledByTimeout = await data.db
    .update(data.jobs)
    .set({
      status: "stalled",
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

  const stalledMachines = await data.db
    .update(data.machines)
    .set({
      status: "inactive",
    })
    .where(
      and(
        lt(
          data.machines.last_ping_at,
          sql`now() - interval '1 second' * ${params?.machineStallTimeout ?? 90}`,
        ),
        eq(data.machines.status, "active"),
      ),
    )
    .returning({
      id: data.machines.id,
      clusterId: data.machines.cluster_id,
    });

  // mark jobs with stalled machines as failed
  const stalledFailedByMachine = await data.db.execute<{
    id: string;
    service: string;
    target_fn: string;
    owner_hash: string;
    remaining_attempts: number;
  }>(
    sql`
      UPDATE jobs as j
      SET status = 'stalled'
      FROM machines as m
      WHERE
        j.status = 'running' AND
        j.executing_machine_id = m.id AND
        m.status = 'inactive' AND
        j.owner_hash = m.cluster_id AND
        j.remaining_attempts > 0
    `,
  );

  const stalledRecoveredJobs = await data.db
    .update(data.jobs)
    .set({
      status: "pending",
      remaining_attempts: sql`remaining_attempts - 1`,
    })
    .where(
      and(eq(data.jobs.status, "stalled"), gt(data.jobs.remaining_attempts, 0)),
    )
    .returning({
      id: data.jobs.id,
      service: data.jobs.service,
      targetFn: data.jobs.target_fn,
      ownerHash: data.jobs.owner_hash,
      remainingAttempts: data.jobs.remaining_attempts,
    });

  const stalledFailedJobs = await data.db
    .update(data.jobs)
    .set({
      status: "failure",
    })
    .where(
      and(
        eq(data.jobs.status, "stalled"),
        lte(data.jobs.remaining_attempts, 0),
      ),
    )
    .returning({
      id: data.jobs.id,
      service: data.jobs.service,
      targetFn: data.jobs.target_fn,
      ownerHash: data.jobs.owner_hash,
      remainingAttempts: data.jobs.remaining_attempts,
    });

  stalledByTimeout.forEach((row) => {
    events.write({
      service: row.service,
      clusterId: row.ownerHash,
      jobId: row.id,
      type: "jobStalled",
      meta: {
        attemptsRemaining: row.remainingAttempts ?? undefined,
        reason: "timeout",
      },
    });
  });

  stalledFailedByMachine.rows.forEach((row) => {
    events.write({
      service: row.service,
      clusterId: row.owner_hash,
      jobId: row.id,
      type: "jobStalled",
      meta: {
        attemptsRemaining: row.remaining_attempts ?? undefined,
        reason: "machine stalled",
      },
    });
  });

  stalledMachines.forEach((row) => {
    events.write({
      type: "machineStalled",
      clusterId: row.clusterId,
      machineId: row.id,
    });
  });

  stalledRecoveredJobs.forEach((row) => {
    events.write({
      service: row.service,
      clusterId: row.ownerHash,
      jobId: row.id,
      type: "jobRecovered",
    });
  });

  stalledFailedJobs.forEach((row) => {
    events.write({
      service: row.service,
      clusterId: row.ownerHash,
      jobId: row.id,
      type: "jobStalledTooManyTimes",
    });
  });

  return {
    stalledFailedByTimeout: stalledByTimeout.map((row) => row.id),
    stalledRecovered: stalledRecoveredJobs.map((row) => row.id),
    stalledMachines: stalledMachines.map((row) => ({
      id: row.id,
      clusterId: row.clusterId,
    })),
    stalledFailedByMachine: stalledFailedByMachine.rows.map((row) => row.id),
  };
}
