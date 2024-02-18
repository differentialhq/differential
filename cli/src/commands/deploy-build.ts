import * as fs from "fs";
import * as os from "os";

import { CommandModule } from "yargs";
import { buildService } from "../lib/package";

interface DeployBuildArgs {
  entrypoint?: string;
  service: string;
}
export const DeployBuild: CommandModule<{}, DeployBuildArgs> = {
  command: "build",
  describe: "Build a Differential service",
  builder: (yargs) =>
    yargs
      .option("entrypoint", {
        describe:
          "Path to service entrypoint file (default: package.json#main)",
        demandOption: false,
        type: "string",
      })
      .option("service", {
        describe: "Service name",
        demandOption: true,
        type: "string",
      }),
  handler: async ({ entrypoint, service }) => {
    const tmpDir = fs.mkdtempSync(os.tmpdir());
    try {
      const outDir = `${tmpDir}/out`;

      console.log("⚙️   Building service...");
      const { packagePath, definitionPath } = await buildService(
        service,
        outDir,
        entrypoint,
      );
      console.log("📦   Built package", packagePath);
      console.log("📄   Built definition", definitionPath);
    } catch (e: any) {
      console.log("🚨   Build failed");
      console.error(e);
    }
  },
};
