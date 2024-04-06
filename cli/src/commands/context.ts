import { CommandModule } from "yargs";
import { ContextSet } from "./context-set";
import { ContextInfo } from "./context-info";
import { ContextSwitch } from "./context-switch";

export const Context: CommandModule = {
  command: "context",
  aliases: ["context"],
  describe: "Manage Differential CLI context",
  builder: (yargs) =>
    yargs.command(ContextInfo).command(ContextSet).command(ContextSwitch),
  handler: ContextInfo.handler,
};
