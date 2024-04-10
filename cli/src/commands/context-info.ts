import { CommandModule } from "yargs";
import { readCurrentContext } from "../lib/context";

export const ContextInfo: CommandModule = {
  command: "info",
  describe: "View CLI context details",
  handler: async () => {
    console.log(readCurrentContext());
  },
};
