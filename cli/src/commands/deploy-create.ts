import debug from "debug";

import * as fs from "fs";
import * as os from "os";

import { CommandModule, argv } from "yargs";
import { buildService } from "../lib/package";
import { uploadPackage } from "../lib/upload";
import { release } from "../lib/release";
import { waitForDeploymentStatus } from "../lib/client";
import { selectCluster, selectService } from "../utils";

const log = debug("differential:cli:deploy:create");

interface DeployCreateArgs {
  entrypoint?: string;
  cluster?: string;
  service?: string;
}
export const DeployCreate: CommandModule<{}, DeployCreateArgs> = {
  command: "create",
  describe: "Create a new Differential service deployment",
  builder: (yargs) =>
    yargs
      .option("entrypoint", {
        describe:
          "Path to service entrypoint file (default: package.json#main)",
        demandOption: false,
        type: "string",
      })
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
  handler: async ({ entrypoint, cluster, service }) => {
    log("Running deploy command", { argv });

    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        return;
      }
    }

    if (!service) {
      service = await selectService(cluster);
      if (!service) {
        console.log("No service selected");
        return;
      }
    }

    const tmpDir = fs.mkdtempSync(os.tmpdir());
    try {
      const outDir = `${tmpDir}/out`;

      console.log("⚙️   Building service...");
      const { packagePath, definitionPath } = await buildService(
        service,
        outDir,
        entrypoint,
      );
      console.log("✅  Build complete");

      console.log("📦  Uploading service...");
      const deployment = await uploadPackage(
        packagePath,
        definitionPath,
        cluster,
        service,
      );
      console.log("✅  Upload complete");

      console.log("☁️   Deploying service");
      await release({
        deploymentId: deployment.id,
        serviceName: service,
        clusterId: cluster,
      });
      await waitForDeploymentStatus(
        deployment.id,
        service,
        cluster,
        "active",
        1000,
      );
      console.log(
        `✅  Deployment complete, ${service}:${deployment.id} is now available!`,
      );
    } finally {
      log("Cleaning up temporary directory", { tmpDir });
      fs.rmSync(tmpDir, { recursive: true });
    }
  },
};
