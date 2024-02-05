import debug from "debug";

import * as fs from "fs";
import * as os from "os";

import { CommandModule, argv } from "yargs";
import { buildPackage } from "../lib/package";
import { uploadPackage } from "../lib/upload";
import { release } from "../lib/release";
import { waitForDeploymentStatus } from "../lib/client";

const log = debug("differential:cli:deploy");

interface DeployArgs {
  entrypoint: string;
  cluster: string;
  service: string;
}
export const Deploy: CommandModule<{}, DeployArgs> = {
  command: "deploy",
  describe: "Deploy a service to differential cloud",
  builder: (yargs) =>
    yargs
      .option("entrypoint", {
        describe: "Path to service entrypoint file",
        demandOption: true,
        type: "string",
      })
      .option("cluster", {
        describe: "Cluster ID",
        demandOption: true,
        type: "string",
      })
      .option("service", {
        describe: "Service name",
        demandOption: true,
        type: "string",
      }),
  handler: async ({ entrypoint, cluster, service }) => {
    log("Running deploy command", { argv });
    if (!process.env.DIFFERENTIAL_API_TOKEN) {
      throw new Error("DIFFERENTIAL_API_TOKEN is required.");
    }

    const tmpDir = fs.mkdtempSync(os.tmpdir());
    try {
      const outDir = `${tmpDir}/out`;

      console.log("⚙️   Building service...");
      const { packagePath, definitionPath } = await buildPackage(
        entrypoint,
        outDir,
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
