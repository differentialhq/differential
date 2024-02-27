import { CommandModule } from "yargs";
import { selectCluster } from "../utils";
import * as fs from "fs";
import * as os from "os";
import {
  buildClientPackage,
  buildProject,
  publishViaNpm,
  zipDirectory,
} from "../lib/package";
import { uploadAsset } from "../lib/upload";
import debug from "debug";
import { client } from "../lib/client";

const log = debug("differential:cli:client-lib:publish");

interface ClientLibraryPublishArgs {
  entrypoint?: string;
  cluster?: string;
  npmPublish?: boolean;
  npmPublic?: boolean;
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
        })
        .option("npmPublish", {
          describe:
            "Publish the client library via system NPM instead of uploading to the cluster",
          demandOption: false,
          type: "boolean",
        })
        .option("npmPublic", {
          describe: "Publish the client library to the public NPM registry",
          demandOption: false,
          default: false,
          type: "boolean",
        }),
    handler: async ({ cluster, entrypoint, npmPublish, npmPublic }) => {
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
        const libraryResponse = await client.createClientLibraryVersion({
          params: {
            clusterId: cluster,
          },
        });

        if (libraryResponse.status !== 201) {
          throw new Error(
            `Failed to create client library: ${libraryResponse.status}`,
          );
        }

        const library = libraryResponse.body;
        const clientPath = await buildClientPackage({
          project,
          cluster,
          version: library.version,
          outDir,
        });

        if (npmPublish) {
          console.log(`📦  Publishing client library via NPM`);
          publishViaNpm({
            path: clientPath,
            publicAccess: npmPublic,
          });
          return;
        }

        console.log(`📦  Publishing client library to Differential`);

        await uploadAsset({
          zipPath: await zipDirectory(clientPath),
          target: library.id,
          type: "client_library",
          cluster,
        });

        console.log(`✅  Published client library to cluster ${cluster}`);
      } finally {
        log("Cleaning up temporary directory", { tmpDir });
        fs.rmSync(tmpDir, { recursive: true });
      }
    },
  };
