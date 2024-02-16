import { CommandModule, showHelp } from "yargs";
import { ClusterCreate } from "./clusters-create";
import { ClusterList } from "./clusters-list";
import { ClusterOpen } from "./clusters-open";
import { ClusterInfo } from "./clusters-info";

export const Clusters: CommandModule = {
  command: "clusters",
  aliases: ["c"],
  describe: "Manage Differential clusters",
  builder: (yargs) =>
    yargs
      .command(ClusterCreate)
      .command(ClusterList)
      .command(ClusterOpen)
      .command(ClusterInfo),
  handler: async () => {
    showHelp();
  },
};
