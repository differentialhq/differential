import { CommandModule } from "yargs";
import { client } from "../lib/client";
import { selectCluster, selectService } from "../utils";
import { cloudEnabledCheck } from "../lib/auth";

interface DeployListArgs {
  cluster?: string;
  service?: string;
}
export const DeployList: CommandModule<{}, DeployListArgs> = {
  command: "list",
  aliases: ["ls"],
  describe: "List Differential cloud deployments",
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
      }),
  handler: async ({ cluster, service }) => {
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

    const d = await client.getDeployments({
      params: {
        clusterId: cluster,
        serviceName: service,
      },
    });
    if (d.status !== 200) {
      console.error(`Failed to fetch deployment info: ${d.status}`);
      return;
    }

    console.log(d.body);
  },
};
