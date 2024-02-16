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
    }

    console.log("Cluster created successfully");
  },
};
