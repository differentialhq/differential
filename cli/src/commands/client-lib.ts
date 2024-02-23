import { CommandModule, showHelp } from "yargs";
import { ClientLibraryPublish } from "./client-lib-publish";

export const ClientLibrary: CommandModule = {
  command: "client",
  describe: "Manage Differential client libraries",
  builder: (yargs) => yargs.command(ClientLibraryPublish),
  handler: async () => {
    showHelp();
  },
};
