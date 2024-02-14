#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Deploy } from "./commands/deploy";
import { Auth } from "./commands/auth";

yargs(hideBin(process.argv))
  .scriptName("differential")
  .strict()
  .hide("version")
  .demandCommand()
  .command(Deploy)
  .command(Auth).argv;
