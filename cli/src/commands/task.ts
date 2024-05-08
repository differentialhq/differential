import { CommandModule } from "yargs";
import { selectCluster } from "../utils";
import { client } from "../lib/client";
import { input } from "@inquirer/prompts";

interface TaskArgs {
  cluster?: string;
  task?: string;
}

export const Task: CommandModule<{}, TaskArgs> = {
  command: "task",
  describe: "Execute a task in the cluster using a human readable prompt",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        describe: "Cluster ID",
        demandOption: false,
        type: "string",
      })
      .option("task", {
        describe: "Task for the cluster to perform",
        demandOption: false,
        type: "string",
      }),
  handler: async ({ cluster, task }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        return;
      }
    }

    if (!task) {
      task = await input({
        message: "Human readable prompt for the cluster to perform",
        validate: (value) => {
          if (!value) {
            return "Prompt is required";
          }
          return true;
        },
      });
    }

    try {
      const result = await executeTask(cluster, task);
      console.log(result);
    } catch (e) {
      console.error(e);
    }
  },
};

const executeTask = async (clusterId: string, task: string) => {
  const result = await client.executeTask({
    params: {
      clusterId,
    },
    body: {
      task,
    },
  });

  if (result.status !== 200) {
    throw new Error(`Failed to prompt cluster: ${result.status}`);
  }
  return result.body.result;
};
