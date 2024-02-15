import { exec } from "child_process";
import { client } from "./lib/client";
import { select } from "@inquirer/prompts";

export const openBrowser = async (url: string) => {
  if (process.platform === "darwin") {
    exec(`open ${url}`);
  } else if (process.platform === "linux") {
    exec(`xdg-open ${url}`);
  } else {
    console.log(`Please open your browser and navigate to ${url}`);
  }
};

export const selectCluster = async (): Promise<string | undefined> => {
  const d = await client.getClustersForUser();
  if (d.status !== 200) {
    console.error(`Failed to get clusters: ${d.status}`);
    return;
  }

  if (!d.body) {
    console.log("No clusters found");
    return;
  }

  return select({
    message: "Select a cluster",
    choices: d.body.map((c: any) => ({ name: c.id, value: c.id })),
  });
};
