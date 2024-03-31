import { CommandModule } from "yargs";
import { selectCluster, selectDeployment, selectService } from "../utils";
import { cloudEnabledCheck } from "../lib/auth";

import { client } from "../lib/client";

interface DeployLogsArgs {
  cluster?: string;
  service?: string;
  deployment?: string;
  start?: number;
  end?: number;
}
export const DeployLogs: CommandModule<{}, DeployLogsArgs> = {
  command: "logs",
  describe: "Retrieve logs for a service deployment",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        describe: "Cluster ID",
        demandOption: false,
        type: "string",
      })
      .option("service", {
        describe: "Service name",
        demandOption: false,
        type: "string",
      })
      .option("deployment", {
        describe: "Deployment ID",
        demandOption: false,
        type: "string",
      })
      .option("start", {
        describe: "Start time (Unix timestamp, milliseconds)",
        demandOption: false,
        type: "number",
      })
      .option("end", {
        describe: "End time (Unix timestamp, milliseconds)",
        demandOption: false,
        type: "number",
      }),
  handler: async ({ cluster, service, deployment, start, end }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        return;
      }
    }

    if (!(await cloudEnabledCheck(cluster))) {
      return;
    }

    if (!service) {
      service = await selectService(cluster);
      if (!service) {
        console.log("No service selected");
        return;
      }
    }

    if (!deployment) {
      deployment = await selectDeployment(cluster, service);
      if (!deployment) {
        console.log("No deployment selected");
        return;
      }
    }

    const logs = await getDeploymentLogs({
      clusterId: cluster,
      serviceName: service,
      deploymentId: deployment,
      options: {
        ...(start !== undefined && { start: new Date(start) }),
        ...(end !== undefined && { end: new Date(end) }),
      },
    });
    logs.forEach((log) => {
      console.log(log.message);
    });
  },
};

const getDeploymentLogs = async ({
  clusterId,
  serviceName,
  deploymentId,
  options,
}: {
  clusterId: string;
  serviceName: string;
  deploymentId: string;
  options?: { start?: Date; end?: Date };
}) => {
  const result = await client.getDeploymentLogs({
    params: {
      clusterId,
      serviceName,
      deploymentId,
    },
    query: options,
  });

  if (result.status !== 200) {
    throw new Error(`Failed to get logs: ${result.status}`);
  }
  return result.body.events;
};
