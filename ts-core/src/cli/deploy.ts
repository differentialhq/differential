import debug from "debug";

import * as fs from "fs";
import * as os from "os";

import { CommandModule, argv } from "yargs";
import { buildPackage } from "./package";
import { uploadPackage } from "./upload";

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
      const { packagePath, definitionPath } = await buildPackage(
        entrypoint,
        outDir,
      );
      await uploadPackage(packagePath, definitionPath, cluster, service);
    } finally {
      log("Cleaning up temporary directory", { tmpDir });
      fs.rmSync(tmpDir, { recursive: true });
    }
  },
};
