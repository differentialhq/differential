import os from "os";
import path from "path";
import fs from "fs";

import http from "http";
import { openBrowser } from "../utils";
import { CLIENT_PACKAGE_SCOPE } from "../constants";
import * as childProcess from "child_process";
import { client } from "./client";
import { readCurrentContext } from "./context";

const TOKEN_PATH = path.join(os.homedir(), ".differential", "credentials");
const CLOUD_WAITLIST_URL = "https://forms.fillout.com/t/9M1VhL8Wxyus";

export const cloudEnabledCheck = async (
  clusterId: string,
): Promise<boolean> => {
  const settings = await client.getClusterSettings({ params: { clusterId } });

  if (settings.status === 200 && settings.body.cloudEnabled) {
    return true;
  }

  console.error(
    "This feature requires Differential Cloud which is currently in private beta.",
  );
  console.error(`To join the waitlist, please visit ${CLOUD_WAITLIST_URL}`);
  return false;
};

export const storeToken = (token: string) => {
  const TOKEN_PATH = path.join(os.homedir(), ".differential", "credentials");
  const dir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TOKEN_PATH, token);
};

const refreshNpmToken = async () => {
  const registryUrl = readCurrentContext().npmRegistryUrl;
  const token = getToken();
  if (token) {
    setNpmConfig(`${CLIENT_PACKAGE_SCOPE}:registry`, registryUrl);
    setNpmConfig(`${registryUrl.replace(/^http(s?):/, "")}:_authToken`, token);
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

export const startTokenFlow = () => {
  const authUrl = `${readCurrentContext().consoleUrl}/cli-auth`;
  openBrowser(authUrl);

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
