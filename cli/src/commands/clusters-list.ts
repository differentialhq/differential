import { CommandModule } from "yargs";
import { client } from "../lib/client";

interface ClusterCreateArgs {
  description?: string;
}
export const ClusterList: CommandModule<{}, ClusterCreateArgs> = {
  command: "list",
  aliases: ["ls"],
  describe: "List Differential clusters",
  handler: async () => {
    const d = await client.getClustersForUser();
    if (d.status !== 200) {
      console.error(`Failed to list clusters: ${d.status}`);
      return;
    }

    if (!d.body) {
      console.log("No clusters found");
      return;
    }

    console.log(
      d.body.map((c) => ({
        ...c,
        apiSecret:
          c.apiSecret.substring(0, 8) + "*".repeat(c.apiSecret.length - 8),
        info: `differential clusters info --cluster ${c.id}`,
      })),
    );
  },
};
