import { CommandModule } from "yargs";
import { CliContext, getCurrentContext, saveContext } from "../lib/context";

type ContextSetArgs = Partial<CliContext> & {
  context?: string;
};

export const ContextSet: CommandModule<{}, ContextSetArgs> = {
  command: "set",
  describe: "Update CLI context values",
  builder: (yargs) =>
    yargs
      .option("apiUrl", {
        describe: "Control Plane API host",
        demandOption: false,
        type: "string",
      })
      .option("consoleUrl", {
        describe: "Management Console host",
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
      })
      .option("deployment", {
        describe: "Deployment id",
        demandOption: false,
        type: "string",
      }),
  handler: async ({
    context,
    apiUrl,
    consoleUrl,
    cluster,
    service,
    deployment,
  }: ContextSetArgs) => {
    if (!context) {
      context = getCurrentContext();
    }
    saveContext(
      {
        ...mapKey("apiUrl", apiUrl),
        ...mapKey("consoleUrl", consoleUrl),
        ...mapKey("cluster", cluster),
        ...mapKey("service", service),
        ...mapKey("deployment", deployment),
      },
      context,
    );
  },
};

const mapKey = (key: string, value?: string) => {
  if (value === undefined) return {};

  if (value === "") {
    console.log(`Clearing context key: ${key}`);
    return { [key]: undefined };
  }

  return { [key]: value };
};
