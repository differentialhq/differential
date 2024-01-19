#!/usr/bin/env node

import yargs from "yargs";
import { buildPackage } from "./package";
import { getPresignedURL, uploadPackage } from "./upload";
import * as fs from "fs";
import * as os from "os";
import { ulid } from "ulid";

import debug from "debug";
const log = debug("differential:cli");

yargs.command(
  "deploy",
  "Deploy a differential service",
  (yargs) => {
    yargs.option("entrypoint", {
      describe: "Service entrypoint",
      demandOption: true,
      type: "string",
    });
    yargs.option("cleanup", {
      describe: "Cleanup package after upload",
      demandOption: false,
      type: "boolean",
      default: true,
    });
  },
  async (argv) => {
    // TODO: Get this from the controle plane
    const url = await getPresignedURL("test-cluster", "test-service", ulid());

    log("Running deploy command", { argv });
    const tmpDir = fs.mkdtempSync(os.tmpdir());
    try {
      const outDir = `${tmpDir}/out`;
      const packagePath = await buildPackage(argv.entrypoint as string, outDir);
      await uploadPackage(url, packagePath);
    } finally {
      if (argv.cleanup) {
        log("Cleaning up temporary directory", { tmpDir });
        fs.rmSync(tmpDir, { recursive: true });
      } else {
        log("Skipping cleanup of temporary directory", { tmpDir });
      }
    }
  },
).argv;
