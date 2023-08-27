import { initialize } from "./program";
import process from "process";

const { greet } = initialize("greeter");

greet("world").then(() => {
  process.exit(0);
});
