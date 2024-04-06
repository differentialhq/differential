import { CommandModule } from "yargs";
import { saveContext } from "../lib/context";
import { API_URL, CONSOLE_URL } from "../constants";

interface ContextSetArgs {
  name: string;
  apiUrl: string;
  consoleUrl: string;
  cluster?: string;
  service?: string;
}
export const ContextSet: CommandModule<{}, ContextSetArgs> = {
  command: "set",
  describe: "Update CLI context values",
  builder: (yargs) =>
    yargs
      .option("name", {
        describe: "Context name",
        default: "default",
        demandOption: false,
        type: "string",
      })
      .option("apiUrl", {
        describe: "Control Plane API host",
        demandOption: false,
        default: API_URL,
        type: "string",
      })
      .option("consoleUrl", {
        describe: "Management Console host",
        demandOption: false,
        default: CONSOLE_URL,
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
  handler: async ({
    name,
    apiUrl,
    consoleUrl,
    cluster,
    service,
  }: ContextSetArgs) => {
    saveContext(
      {
        apiUrl,
        consoleUrl,
        ...mapKey("apiUrl", apiUrl),
        ...mapKey("consoleUrl", consoleUrl),
        ...mapKey("cluster", cluster),
        ...mapKey("service", service),
        ...(service !== undefined ? { service } : {}),
      },
      name,
    );
  },
};

const mapKey = (key: string, value?: string) => {
  if (value === undefined) return {};
  if (value === "") return { [key]: undefined };

  return { [key]: value };
};
