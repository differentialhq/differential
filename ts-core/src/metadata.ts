import debug from "debug";
import { promises as fs } from "fs";

const log = debug("differential:client:metadata");

function callsites() {
  const _prepareStackTrace = Error.prepareStackTrace;
  try {
    let result: NodeJS.CallSite[] = [];
    Error.prepareStackTrace = (_, callSites) => {
      const callSitesWithoutCurrent = callSites.slice(1);
      result = callSitesWithoutCurrent;
      return callSitesWithoutCurrent;
    };

    new Error().stack;
    return result;
  } finally {
    Error.prepareStackTrace = _prepareStackTrace;
  }
}

export async function inferTypes() {
  const callSites = callsites();
  const serviceFile = callSites
    .find((cs) => cs.getMethodName() === "start")
    ?.getFileName();

  if (!serviceFile) {
    log("No service file found in call stack");
    return;
  }

  const dtsFiles = serviceFile.split(".service.")[0] + ".service.d.ts";

  const dtsFileReadable = await fs
    .access(dtsFiles, fs.constants.R_OK)
    .then(() => true)
    .catch(() => false);

  if (!dtsFileReadable) {
    log("No readable service.d.ts file found for service file");
    return;
  }

  const fileContent = await fs.readFile(dtsFiles, "utf-8");

  log("Service file found in call stack: %s", serviceFile);

  return fileContent;
}
