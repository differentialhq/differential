import { CommandModule, showHelp } from "yargs";
import { startTokenFlow } from "../lib/auth";

export const Auth: CommandModule = {
  command: "auth",
  describe: "Authenticate with the Differential API.",
  builder: (yargs) =>
    yargs.command({
      command: "login",
      describe: "Authenticate the Differential CLI.",
      handler: () => {
        startTokenFlow();
      },
    }),
  handler: async ({ command }) => {
    switch (command) {
      case "login":
        console.log("Authenticating the Differential CLI...");
        break;
      default:
        showHelp();
    }
  },
};
