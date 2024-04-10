import { CliContext } from "./lib/context";

export const DEFAULT_CONSOLE_URL = "https://console.differential.dev";
export const DEFAULT_API_URL = "https://api.differential.dev";
export const NPM_REGISTRY_PATH = `/packages/npm/`;
export const CLIENT_PACKAGE_SCOPE = "@differential.dev";

export const DEFAULT_CLI_CONTEXT: CliContext = {
  apiUrl: DEFAULT_API_URL,
  consoleUrl: DEFAULT_CONSOLE_URL,
  npmRegistryUrl: DEFAULT_API_URL + NPM_REGISTRY_PATH,
};
