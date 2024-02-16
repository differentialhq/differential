import { CommandModule } from "yargs";
import { openBrowser, selectCluster } from "../utils";
import { BASE_URL } from "../constants";

interface ClusterOpenArgs {
  cluster?: string;
}
export const ClusterOpen: CommandModule<{}, ClusterOpenArgs> = {
  command: "open",
  describe: "Open a Differential cluster in the console",
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

    openBrowser(`${BASE_URL}/clusters/${cluster}`);
  },
};
