#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Deploy } from "./commands/deploy";

yargs(hideBin(process.argv))
  .scriptName("differential")
  .strict()
  .hide("version")
  .command(Deploy).argv;
