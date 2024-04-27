import fs from "fs";
import { Project } from "ts-morph";
import { CommandModule } from "yargs";
import { client } from "../lib/client";
import { selectCluster } from "../utils";

interface ServicesRegisterArgs {
  cluster?: string;
  service: string;
}

export const ServicesRegister: CommandModule<{}, ServicesRegisterArgs> = {
  command: "register",
  describe: "Explicitly register a service with Cluster",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        describe: "Cluster ID",
        demandOption: false,
        type: "string",
      })
      .option("service", {
        describe: "Service name",
        demandOption: true,
        type: "string",
      }),
  handler: async ({ cluster, service }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        process.exit(1);
      }
    }

    // check if the name.service.ts exists
    if (!fs.existsSync(`${service}.service.ts`)) {
      throw new Error(`Service file ${service}.service.ts not found`);
    }

    const project = new Project({
      compilerOptions: {
        declaration: true,
        emitDecoratorMetadata: true,
        emitDeclarationOnly: true,
        outFile: "service.d.ts",
      },
    });

    project.addSourceFileAtPath(`${service}.service.ts`);

    const result = project.emitToMemory();

    const typesText = result
      .getFiles()
      .find((x) => x.filePath.includes("service.d.ts"))?.text;

    if (!typesText) {
      throw new Error("Failed to generate types for service");
    }

    const storeResult = await client.storeSchema({
      body: {
        schema: typesText,
      },
      params: {
        clusterId: cluster,
        serviceName: service,
      },
    });

    if (storeResult.status !== 204) {
      console.log("Failed to register service", {
        result: storeResult,
      });
    }

    console.log(`Service ${service} registered with cluster ${cluster}`);
  },
};
