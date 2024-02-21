import debug from "debug";

import * as fs from "fs";
import * as os from "os";

import { CommandModule, argv } from "yargs";
import {
  buildClientPackage,
  buildProject,
  packageService,
} from "../lib/package";
import { uploadPackage } from "../lib/upload";
import { release } from "../lib/release";
import { waitForDeploymentStatus } from "../lib/client";
import { selectCluster } from "../utils";
import { select } from "@inquirer/prompts";

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

    const tmpDir = fs.mkdtempSync(os.tmpdir());
    try {
      const outDir = `${tmpDir}/out`;

      console.log("⚙️   Building project");

      const project = await buildProject(outDir, entrypoint);

      console.log("🔍   Finding service registrations");
      if (project.serviceRegistrations.size === 0) {
        throw new Error("No service registrations found in project");
      }

      if (service) {
        if (!project.serviceRegistrations.has(service)) {
          throw new Error(`Service ${service} not found in project`);
        }
      } else {
        const choices = Array.from(project.serviceRegistrations.keys()).map(
          (name) => ({
            name,
            value: name,
          }),
        );

        service = await select({
          message: "Select a service",
          choices: choices,
        });
      }

      console.log(`📦  Packaging service ${service}`);

      const { packagePath } = await packageService(service, project, outDir);

      console.log(`📦  Packaging client library`);

      //const clientPath = await buildClientPackage(project, outDir);

      console.log(`📦  Uploading service ${service}`);

      const deployment = await uploadPackage(packagePath, cluster, service);

      console.log(`☁️   Deploying ${service}:${deployment.id} to ${cluster}`);

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
