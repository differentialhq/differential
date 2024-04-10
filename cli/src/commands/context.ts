import { CommandModule } from "yargs";
import { ContextSet } from "./context-set";
import { ContextInfo } from "./context-info";

export const Context: CommandModule = {
  command: "context",
  aliases: ["context"],
  describe: "Manage Differential CLI context",
  builder: (yargs) => yargs.command(ContextInfo).command(ContextSet),
  handler: ContextInfo.handler,
};
