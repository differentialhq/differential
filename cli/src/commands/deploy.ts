import { CommandModule, showHelp } from "yargs";
import { DeployCreate } from "./deploy-create";
import { DeployInfo } from "./deploy-info";

export const Deploy: CommandModule = {
  command: "deployments",
  aliases: ["deploy", "d"],
  describe: "Manage Differential cloud deployments",
  builder: (yargs) => yargs.command(DeployCreate).command(DeployInfo),
  handler: async () => {
    showHelp();
  },
};
