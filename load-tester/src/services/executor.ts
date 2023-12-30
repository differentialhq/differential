import { d } from "../d";
import process from "process";

async function exec(execArgs: {
  wait: number;
  error: boolean;
  input: string;
  outputType:
    | "object"
    | "string"
    | "array"
    | "number"
    | "boolean"
    | "null"
    | "undefined";
  kill: boolean;
}) {
  if (execArgs.wait) {
    await new Promise((resolve) => setTimeout(resolve, execArgs.wait));
  }

  if (execArgs.error) {
    throw new Error("error");
  }

  if (execArgs.kill) {
    process.kill(process.pid, "SIGTERM");
  }

  switch (execArgs.outputType) {
    case "object":
      return { type: "object", value: execArgs.input };
    case "string":
      return execArgs.input;
    case "array":
      return [execArgs.input];
    case "number":
      return 1;
    case "boolean":
      return true;
    case "null":
      return null;
    case "undefined":
      return undefined;
  }
}

export const executorService = d.service({
  name: "executor",
  functions: {
    exec,
  },
});

executorService.start().then(() => {
  console.log("executor started");
});
