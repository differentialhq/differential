import { CommandModule } from "yargs";
import { switchContext } from "../lib/context";

interface ContextSwitchArgs {
  name: string;
}
export const ContextSwitch: CommandModule<{}, ContextSwitchArgs> = {
  command: "switch",
  describe: "Switch CLI context",
  builder: (yargs) =>
    yargs.option("name", {
      describe: "Context name",
      default: "default",
      demandOption: false,
      type: "string",
    }),
  handler: async ({ name }: ContextSwitchArgs) => {
    switchContext(name);
  },
};
