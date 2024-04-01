import { CommandModule } from "yargs";
import { client } from "../lib/client";

interface ClusterCreateArgs {
  description?: string;
}
export const ClusterCreate: CommandModule<{}, ClusterCreateArgs> = {
  command: "create",
  describe: "Create a new Differential cluster",
  builder: (yargs) =>
    yargs.option("description", {
      describe: "Cluster Description",
      demandOption: false,
      type: "string",
    }),
  handler: async ({ description }) => {
    const d = await client.createClusterForUser({
      body: {
        description: description ?? "CLI Created Cluster",
      },
    });

    if (d.status !== 204) {
      console.error(`Failed to create cluster: ${d.status}`);
      return;
    } else {
      console.log("Cluster created successfully");

      const clusters = await client.getClustersForUser();

      if (clusters.status === 200) {
        const cluster = clusters.body.sort((a, b) =>
          a.createdAt > b.createdAt ? -1 : 1,
        )[0];

        console.log(cluster);
      }
    }
  },
};
