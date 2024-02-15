import { CommandModule } from "yargs";
import { client } from "../lib/client";

interface DeployInfoArgs {
  cluster: string;
  service: string;
  deployment: string;
}
export const DeployInfo: CommandModule<{}, DeployInfoArgs> = {
  command: "info",
  describe: "Display information about a Differential cloud deployment",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        describe: "Cluster ID",
        demandOption: true,
        type: "string",
      })
      .option("service", {
        describe: "Service name",
        demandOption: true,
        type: "string",
      })
      .option("deployment", {
        describe: "Deployment ID",
        demandOption: true,
        type: "string",
      }),
  handler: async ({ cluster, service, deployment }) => {
    const d = await client.getDeployment({
      params: {
        clusterId: cluster,
        serviceName: service,
        deploymentId: deployment,
      },
    });
    if (d.status !== 200) {
      console.error(`Failed to fetch deployment info: ${d.status}`);
      return;
    }

    console.log(d.body);
  },
};
