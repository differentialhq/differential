import { exec } from "child_process";
import { client } from "./lib/client";
import { select, input } from "@inquirer/prompts";

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
  if (d.status === 401) {
    console.log(
      "You are not logged in. Please run:\n\t$ differential auth login",
    );
    return;
  }

  if (d.status !== 200) {
    console.error(`Failed to get clusters: ${d.status}.`);
    return;
  }

  if (!d.body || !d.body.length) {
    console.log("No clusters found");
    return;
  }

  return select({
    message: "Select a cluster",
    choices: d.body.map((c: any) => ({ name: c.id, value: c.id })),
  });
};

export const selectService = async (
  clusterId: string,
  allowCreate = false,
): Promise<string | undefined> => {
  const d = await client.getClusterDetailsForUser({
    params: { clusterId },
  });

  if (d.status !== 200) {
    console.error(`Failed to get cluster: ${d.status}`);
    return;
  }

  if (!d.body || !d.body.definitions) {
    console.log("No services found");
    return;
  }

  if (!d.body.definitions.length && !allowCreate) {
    console.log("No services found");
    return;
  }

  const choices = d.body.definitions.map((c: any) => ({
    name: c.name,
    value: c.name,
  }));

  const inputOption = { name: "Create a new service", value: "create" };
  if (allowCreate) {
    choices.push(inputOption);
  }

  const selection = await select({
    message: "Select a service",
    choices,
  });

  if (selection === inputOption.value) {
    return await input({
      message: "Enter the name of the service",
      validate: (value) => {
        if (!value) {
          return "Service name is required";
        }
        if (value.match(/[^A-Za-z0-9-]/)) {
          return "Service name can only contain letters, numbers, and hyphens";
        }
        return true;
      },
    });
  }

  return selection;
};

export const selectDeployment = async (
  clusterId: string,
  serviceName: string,
): Promise<string | undefined> => {
  const d = await client.getDeployments({
    params: {
      clusterId,
      serviceName,
    },
  });
  if (d.status !== 200) {
    console.error(`Failed to get deployments: ${d.status}`);
    return;
  }

  if (!d.body || !d.body.length) {
    console.log("No deployments found");
    return;
  }

  return select({
    message: "Select a deployment",
    choices: d.body.map((c: any) => ({
      name: `${c.id} (${c.status})`,
      value: c.id,
    })),
  });
};
