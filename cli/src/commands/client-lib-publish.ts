import { CommandModule } from "yargs";
import { selectCluster } from "../utils";
import * as fs from "fs";
import * as os from "os";
import { buildClientPackage, buildProject } from "../lib/package";
import { uploadClientLib } from "../lib/upload";
import debug from "debug";

const log = debug("differential:cli:client-lib:publish");

interface ClientLibraryPublishArgs {
  entrypoint?: string;
  cluster?: string;
}
export const ClientLibraryPublish: CommandModule<{}, ClientLibraryPublishArgs> =
  {
    command: "publish",
    describe: "Publish a client library",
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

      const tmpDir = fs.mkdtempSync(os.tmpdir());
      try {
        const outDir = `${tmpDir}/out`;

        console.log("⚙️   Building project");

        const project = await buildProject(outDir, entrypoint);

        console.log("🔍   Finding service registrations");
        if (project.serviceRegistrations.size === 0) {
          throw new Error("No service registrations found in project");
        }

        console.log(`📦  Packaging client library`);

        const clientPath = await buildClientPackage(project, outDir);

        console.log(`📦  Uploading service client library`);

        await uploadClientLib(clientPath, cluster);

        console.log(`✅  Published client library to cluster ${cluster}`);
      } finally {
        log("Cleaning up temporary directory", { tmpDir });
        fs.rmSync(tmpDir, { recursive: true });
      }
    },
  };
