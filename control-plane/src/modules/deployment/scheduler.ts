import { and, desc, eq, gt, sql } from "drizzle-orm";
import { registerCron } from "../cron";
import * as data from "../data";
import { getDeploymentProvider } from "./deployment-provider";
import { ulid } from "ulid";
import {
  Deployment,
  getDeployment,
  updateDeploymentResult,
} from "./deployment";
import { env } from "../../utilities/env";
import * as events from "../observability/events";
import { logger } from "../../utilities/logger";
import { backgrounded } from "../util";

const getJobBacklog = async () => {
  return await data.db
    .select({
      deployment_id: data.jobs.deployment_id,
      pending: sql<number>`count(${data.jobs.id})`,
    })
    .from(data.jobs)
    .where(eq(data.jobs.status, "pending"))
    .groupBy(data.jobs.deployment_id);
};

const getRecentNotifications = async (
  deploymentId: string,
  count: number = 1,
): Promise<{ created_at: Date }[]> => {
  const notificationResult = await data.db
    .select({
      created_at: data.deploymentNotification.created_at,
    })
    .from(data.deploymentNotification)
    .where(eq(data.deploymentNotification.deployment_id, deploymentId))
    .orderBy(desc(data.deploymentNotification.created_at))
    .limit(count);

  return notificationResult;
};

const getMachineCount = async (
  deploymentId: string,
  lastPingAfter?: Date,
): Promise<number> => {
  const where = lastPingAfter
    ? and(
        eq(data.machines.deployment_id, deploymentId),
        gt(data.machines.last_ping_at, lastPingAfter),
      )
    : eq(data.machines.deployment_id, deploymentId);

  const machines = await data.db
    .select({
      count: sql<number>`count(${data.machines.id})`,
    })
    .from(data.machines)
    .where(where);

  return machines[0].count ?? 0;
};

const stalledDeploymentCheck = async (deployment: Deployment) => {
  // Check if we have ever receved a ping from a machine for this deployment
  const allMachines = await getMachineCount(deployment.id);
  if (allMachines > 0) {
    return;
  }

  logger.warn("Marking deployment stalled", {
    deploymentId: deployment.id,
    service: deployment.service,
    clusterId: deployment.clusterId,
  });

  await updateDeploymentResult(deployment, "failed");

  events.write({
    type: "deploymentStalled",
    deploymentId: deployment.id,
    service: deployment.service,
    clusterId: deployment.clusterId,
  });
};

// Scheduled job which checks for pending jobs and notifies the deployment providers.
// This is a naive implementation that will lead to duplicate notifications as there is no locking
export const start = async () => {
  if (!env.DEPLOYMENT_SCHEDULING_ENABLED) {
    logger.info("Deployment scheduling is disabled");
    return;
  }
  registerCron(
    async () => {
      for (const backlog of await getJobBacklog()) {
        if (backlog.deployment_id == undefined) continue;

        //TODO: This should be combined with the group by query
        const deployment = await getDeployment(backlog.deployment_id);
        if (!deployment) {
          continue;
        }

        if (deployment.status == "failed") {
          logger.info("Skipping notification, deployment has failed", {
            deploymentId: deployment.id,
            service: deployment.service,
            clusterId: deployment.clusterId,
          });
          continue;
        }

        const provider = getDeploymentProvider(deployment.provider);
        if (!provider) {
          continue;
        }

        const recentNotifications = await getRecentNotifications(
          deployment.id,
          10,
        );

        if (recentNotifications.length > 0) {
          // Check if the last notification was within the minimum interval
          const notificationInterval =
            Date.now() - recentNotifications[0]?.created_at.getTime();
          if (notificationInterval < provider.minimumNotificationInterval()) {
            continue;
          }
        }

        const runningMachines = await getMachineCount(
          deployment.id,
          new Date(Date.now() - provider.minimumNotificationInterval()),
        );

        if (runningMachines == 0 && recentNotifications.length >= 10) {
          stalledDeploymentCheck(deployment);
        }

        await data.db.insert(data.deploymentNotification).values({
          id: ulid(),
          deployment_id: deployment.id,
        });

        events.write({
          type: "deploymentNotified",
          deploymentId: deployment.id,
          service: deployment.service,
          clusterId: deployment.clusterId,
          meta: {
            pendingJobs: backlog.pending,
            machineCount: runningMachines,
          },
        });
        await provider.notify(deployment, backlog.pending, runningMachines);
      }
    },
    { interval: 500 },
  );
};
