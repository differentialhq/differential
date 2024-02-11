import { and, desc, eq, gt, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { registerCron } from "../cron";
import * as data from "../data";
import { getDeployment } from "./deployment";
import { getDeploymentProvider } from "./deployment-provider";

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

const getLastNotification = async (
  deploymentId: string,
): Promise<{ created_at: Date } | null> => {
  const notificationResult = await data.db
    .select({
      created_at: data.deploymentNotification.created_at,
    })
    .from(data.deploymentNotification)
    .where(eq(data.deploymentNotification.deployment_id, deploymentId))
    .orderBy(desc(data.deploymentNotification.created_at))
    .limit(1);

  return notificationResult[0];
};

const getMachineCount = async (
  deploymentId: string,
  lastPingAfter: Date,
): Promise<number> => {
  const machines = await data.db
    .select({
      count: sql<number>`count(${data.machines.id})`,
    })
    .from(data.machines)
    .where(
      and(
        eq(data.machines.deployment_id, deploymentId),
        gt(data.machines.last_ping_at, lastPingAfter),
      ),
    );

  return machines[0].count ?? 0;
};

const scheduleDeployments = async () => {
  for (const backlog of await getJobBacklog()) {
    if (backlog.deployment_id == undefined) continue;

    //TODO: This should be combined with the group by query
    const deployment = await getDeployment(backlog.deployment_id);
    if (!deployment) {
      continue;
    }

    const provider = getDeploymentProvider(deployment.provider);
    if (!provider) {
      continue;
    }

    const lastNotification = await getLastNotification(deployment.id);

    if (lastNotification) {
      // Check if the last notification was within the minimum interval
      const notificationInterval =
        Date.now() - lastNotification?.created_at.getTime();
      if (notificationInterval < provider.minimumNotificationInterval()) {
        continue;
      }
    }

    const runningMachines = await getMachineCount(
      deployment.id,
      new Date(Date.now() - provider.minimumNotificationInterval()),
    );

    await data.db.insert(data.deploymentNotification).values({
      id: ulid(),
      deployment_id: deployment.id,
    });
    await provider.notify(deployment, backlog.pending, runningMachines);
  }
};

// Scheduled job which checks for pending jobs and notifies the deployment providers.
// This is a naive implementation that will lead to duplicate notifications as there is no locking
export const start = async () => {
  if (!process.env.DEPLOYMENT_SCHEDULING_ENABLED) {
    return;
  }

  registerCron("scheduleDeployments", scheduleDeployments, { interval: 500 });
};
