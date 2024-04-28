import { CommandModule, showHelp } from "yargs";
import { ServicesRegister } from "./services-register";

export const Services: CommandModule = {
  command: "services",
  aliases: ["s"],
  describe: "Manage Differential services",
  builder: (yargs) => yargs.command(ServicesRegister),
  handler: async () => {
    showHelp();
  },
};
