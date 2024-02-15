import { CommandModule } from "yargs";
import { client } from "../lib/client";
import { selectCluster } from "../utils";

interface ClusterInfoArgs {
  cluster?: string;
}
export const ClusterInfo: CommandModule<{}, ClusterInfoArgs> = {
  command: "info",
  describe: "Display information about a Differential cluster",
  builder: (yargs) =>
    yargs.option("cluster", {
      describe: "Cluster ID",
      demandOption: false,
      type: "string",
    }),
  handler: async ({ cluster }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        return;
      }
    }

    getClusterDetails(cluster);
  },
};

const getClusterDetails = async (clusterId: string) => {
  const d = await client.getClusterDetailsForUser({
    params: {
      clusterId,
    },
  });
  if (d.status !== 200) {
    console.error(`Failed to get cluster details: ${d.status}`);
    return;
  }
  console.log(d.body);
};
