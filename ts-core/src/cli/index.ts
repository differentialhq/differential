#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { Deploy } from "./deploy";

yargs(hideBin(process.argv))
  .scriptName("differential")
  .strict()
  .hide("version")
  .hide("help")
  .command(Deploy).argv;
