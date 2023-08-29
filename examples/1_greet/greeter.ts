import { greet } from "./program";
import process from "process";

greet("world").then(() => {
  process.exit(0);
});
