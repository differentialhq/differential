import os from "os";
import path from "path";
import fs from "fs";

import http from "http";
import { openBrowser } from "../utils";
import {
  CONSOLE_URL,
  CLIENT_PACKAGE_SCOPE,
  NPM_REGISTRY_URL,
} from "../constants";
import * as childProcess from "child_process";

const TOKEN_PATH = path.join(os.homedir(), ".differential", "credentials");

export const storeToken = (token: string) => {
  const TOKEN_PATH = path.join(os.homedir(), ".differential", "credentials");
  const dir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TOKEN_PATH, token);
};

const refreshNpmToken = async () => {
  const token = getToken();
  if (token) {
    setNpmConfig(`${CLIENT_PACKAGE_SCOPE}:registry`, NPM_REGISTRY_URL);
    setNpmConfig(
      `${NPM_REGISTRY_URL.replace(/^http(s?):/, "")}:_authToken`,
      token,
    );
  }
};

const setNpmConfig = async (key: string, value: string) => {
  childProcess.execSync(`npm config set ${key}=${value}`);
};

export const getToken = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    return fs.readFileSync(TOKEN_PATH, { encoding: "utf-8" });
  }
  return null;
};

const AUTH_URL = `${CONSOLE_URL}/cli-auth`;
export const startTokenFlow = () => {
  openBrowser(AUTH_URL);

  console.log("Listening at port 9999");
  const server = http
    .createServer((req, res) => {
      const token = new URL(
        req.url ?? "",
        "http://localhost:9999",
      ).searchParams.get("token");
      if (token) {
        storeToken(token);
        refreshNpmToken();
        console.log("The Differential CLI has been authenticated.");
        const body = `
      <html>
        <script>
          setTimeout(() => {
            window.close();
          }, 1000);
        </script>
        <body>
          <h1>Authenticated!</h1>
          <p>You can close this window now.</p>
        </body>
      </html>`;
        res.write(body, () => res.end(() => server.close()));
      } else {
        console.error("Failed to authenticate.");
        const body = `
      <html>
        <body>
          <h1>Not authenticated</h1>
          <p>Something went wrong. Please try again.</p>
        </body>
      </html>`;
        res.write(body, () => res.end(() => server.close()));
      }
    })
    .listen(9999);
};
