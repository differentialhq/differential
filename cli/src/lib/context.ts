import path from "path";
import fs from "fs";
import { DEFAULT_CLI_CONTEXT } from "../constants";

export type CliContext = {
  apiUrl: string;
  consoleUrl: string;
  npmRegistryUrl: string;
  cluster?: string;
  service?: string;
  deployment?: string;
};

let CURRENT_CONTEXT = "default";

export const setCurrentContext = ({ context }: { context: string }) => {
  console.log(`Running with configuration context: ${context}`);
  CURRENT_CONTEXT = context;
};

export const getCurrentContext = () => {
  return CURRENT_CONTEXT;
};

export const saveContext = (
  inputContext: Partial<CliContext>,
  name?: string,
) => {
  const updatedContext = {
    ...readContext(name),
    ...inputContext,
  };

  fs.writeFileSync(getContextPath(name), JSON.stringify(updatedContext));
};

// Loads the context specified or the "default" context if not.
export const readContext = (name?: string): CliContext => {
  let context = DEFAULT_CLI_CONTEXT;

  // Load the default context for merging
  if (name) {
    context = readContext();
  }

  const contextFile = getContextPath(name);
  if (fs.existsSync(contextFile)) {
    const file = fs.readFileSync(contextFile, { encoding: "utf-8" });
    // Merge default context
    context = {
      ...context,
      ...JSON.parse(file),
    };
  }
  return context;
};

export const readCurrentContext = () => {
  return readContext(getCurrentContext());
};

const getContextPath = (name: string = "default") => {
  return path.join(
    process.cwd(),
    name === "default" ? "differential.json" : `differential.${name}.json`,
  );
};
