import os from "os";
import path from "path";
import fs from "fs";

export type CliContext = {
  apiUrl: string;
  consoleUrl: string;
  cluster?: string;
  service?: string;
};

const BASE_CONTEXT_PATH = path.join(os.homedir(), ".differential");

export const saveContext = (inputContext: CliContext, name: string) => {
  const contextPath = path.join(BASE_CONTEXT_PATH, `context.${name}`);
  const dir = path.dirname(contextPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const updatedContext = {
    ...readContext(name),
    ...inputContext,
  };

  fs.writeFileSync(contextPath, JSON.stringify(updatedContext));
};

export const readContext = (name: string) => {
  const contextPath = path.join(BASE_CONTEXT_PATH, `context.${name}`);
  if (fs.existsSync(contextPath)) {
    const file = fs.readFileSync(contextPath, { encoding: "utf-8" });
    // TODO: Replace with zod parsing
    return JSON.parse(file) as CliContext;
  }
  return {};
};

export const switchContext = (name: string) => {
  const contextPath = path.join(BASE_CONTEXT_PATH, `context.${name}`);
  const currentLink = path.join(BASE_CONTEXT_PATH, `context.current`);
  fs.rmSync(currentLink, { force: true });
  fs.symlinkSync(contextPath, currentLink);
};
