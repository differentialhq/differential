import { CommandModule } from "yargs";
import { selectCluster } from "../utils";
import * as fs from "fs";
import * as os from "os";
import { buildProject } from "../lib/package";
import debug from "debug";
import { cloudEnabledCheck } from "../lib/auth";

import repl from "repl";
import { Differential } from "@differentialhq/core";
import { client } from "../lib/client";

const log = debug("differential:cli:repl");

interface ReplArgs {
  cluster?: string;
  entrypoint?: string;
}
export const Repl: CommandModule<{}, ReplArgs> = {
  command: "repl",
  describe: "Start an interactive session with a Differential cluster",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        describe: "Cluster ID",
        demandOption: false,
        type: "string",
      })
      .option("entrypoint", {
        describe:
          "Path to service entrypoint file (default: package.json#main)",
        demandOption: false,
        type: "string",
      }),
  handler: async ({ cluster, entrypoint }) => {
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

    const tmpDir = fs.mkdtempSync(os.tmpdir());
    try {
      const outDir = `${tmpDir}/out`;

      console.log("⚙️   Building project");

      const project = await buildProject(outDir, entrypoint);

      console.log("🔍   Finding service registrations in project");
      if (project.serviceRegistrations.size === 0) {
        throw new Error("No service registrations found in project");
      }

      const apiSecret = await getClusterApiKey(cluster);

      console.log("✅   Differential REPL session started!");

      console.log("\n🚀   The following services are available for use:");
      for (const service of project.serviceRegistrations.keys()) {
        console.log(`     ${service}`);
      }

      console.log(
        "\nCall functions with `await <service>.<function>(<args>)`\n",
      );

      const replServer = repl.start("> ");

      replServer.context.d = new Differential(apiSecret);
      for (const service of project.serviceRegistrations.keys()) {
        replServer.context[service] = replServer.context.d.client(service);
      }
    } finally {
      log("Cleaning up temporary directory", { tmpDir });
      fs.rmSync(tmpDir, { recursive: true });
    }
  },
};

const getClusterApiKey = async (clusterId: string) => {
  const result = await client.getClusterDetailsForUser({
    params: {
      clusterId,
    },
  });

  if (result.status !== 200) {
    throw new Error(`Failed to get cluster: ${result.status}`);
  }
  return result.body.apiSecret;
};
