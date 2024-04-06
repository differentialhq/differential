#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Deploy } from "./commands/deploy";
import { Auth } from "./commands/auth";
import { getToken } from "./lib/auth";
import { Clusters } from "./commands/clusters";
import { ClientLibrary } from "./commands/client-lib";
import { Repl } from "./commands/repl";
import { Context } from "./commands/context";

const cli = yargs(hideBin(process.argv))
  .scriptName("differential")
  .strict()
  .hide("version")
  .demandCommand()
  .command(Auth);

const authenticated = getToken();
if (authenticated) {
  cli
    .command(Deploy)
    .command(Clusters)
    .command(ClientLibrary)
    .command(Repl)
    .command(Context);
} else {
  console.log(
    "Diffential CLI is not authenticated. Please run `differential auth login` to authenticate.",
  );
}

cli.argv;
