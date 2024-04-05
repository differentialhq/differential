import { client } from "@/client/client";
import { auth } from "@clerk/nextjs";
import SyntaxHighlighter from "react-syntax-highlighter";
import { default as dark } from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark";
import { SecretKeyReveal } from "../SecretKeyReveal";
import { ActivityChart } from "./ActivityChart";
import { CopyButton } from "./CopyButton";
import Link from "next/link";

function nearestMinute(date: Date) {
  const d = new Date(date);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

const script = (clusterName: string, apiSecret: string) =>
  `mkdir CLUSTER_NAME
cd CLUSTER_NAME
npm init -y
npm i @differentialhq/core@latest
cat << 'EOF' > index.ts

import { Differential } from '@differentialhq/core';
import fs from 'fs';

export const d = new Differential('CLUSTER_TOKEN');

export const dbService = d.service({
  name: 'db',
  functions: {
    put: async (key: string, value: string) => {
      console.log(\`💽 Storing \${key} = \${value}\`)
      await fs.promises.writeFile(key, value);
    },
    get: async (key: string) => {
      console.log(\`💽 Fetching \${key}\`)
      return fs.promises.readFile(key, 'utf8');
    }
  },
});

dbService.start().then(() => {
  console.log(\`🚀 db service started\`);
}).catch(console.error)

EOF
npx tsx index.ts`
    .replaceAll("CLUSTER_NAME", clusterName)
    .replaceAll("CLUSTER_TOKEN", apiSecret);

const curl = (clusterId: string, apiSecret: string) =>
  `# set a value
curl -v http://localhost:4000/clusters/${clusterId}/execute \n\t --header "Authorization: Bearer ${apiSecret}" \n\t --header "Content-Type: application/json" \n\t --data '{ "service":"db", "function":"put", "args":["foo","bar"] }' \n\n
# get the value back
curl -v http://localhost:4000/clusters/${clusterId}/execute \n\t --header "Authorization: Bearer ${apiSecret}" \n\t --header "Content-Type: application/json" \n\t --data '{ "service":"db", "function":"get", "args":["foo"] }'`;

export default async function Page({
  params,
}: {
  params: { clusterId: string };
}) {
  const { getToken } = await auth();

  const clusterResult = await client.getClusterDetailsForUser({
    headers: {
      authorization: `Bearer ${await getToken()}`,
    },
    params: {
      clusterId: params.clusterId,
    },
  });

  if (clusterResult.status !== 200) {
    return null;
  }

  const info = [
    {
      key: "Active Functions Calls",
      value: clusterResult.body.jobs.filter((j) => j.status === "running")
        .length,
    },
    {
      key: "Registered Functions",
      value: clusterResult.body.definitions.length,
    },
    {
      key: "Live Machines",
      value: clusterResult.body.machines.filter((m) => {
        return (
          (new Date(m.lastPingAt ?? 0).getTime() ?? -Infinity) >
          Date.now() - 60 * 1000
        );
      }).length,
    },
    {
      key: "Cloud Deployments",
      value: clusterResult.body.deployments.length,
    },
  ];

  const services = clusterResult.body.jobs.reduce((acc, curr) => {
    const service = `${curr.service}:${curr.targetFn}`;

    if (!acc.includes(service)) {
      acc.push(service);
    }

    return acc;
  }, [] as string[]);

  const activity = clusterResult.body.jobs
    .map((j) => {
      return {
        timestamp: nearestMinute(new Date(j.createdAt)),
        service: `${j.service}:${j.targetFn}`,
      };
    })
    .reduce(
      (acc, curr) => {
        const key = `${curr.timestamp.getTime()}-${curr.service}`;

        acc[key] = acc[key] || {
          timestamp: curr.timestamp,
          [curr.service as string]: 0,
        };

        acc[key][curr.service as string] += 1;

        return acc;
      },
      {} as Record<string, any>,
    );

  const a = Object.values(activity);

  return (
    <div className="py-8 flex space-y-16 flex-col">
      {a.length > 0 ? (
        <div>
          <h2 className="text-xl">Latest Activity</h2>
          <div className="mt-8 -ml-8">
            <ActivityChart activity={Object.values(a)} series={services} />
          </div>
        </div>
      ) : null}
      <div>
        <h2 className="text-xl">Secret Keys</h2>
        <p className="text-gray-400 mt-2">
          Any service with access to these keys can interact with your cluster,
          and other connected services.
        </p>
        <SecretKeyReveal secretKey={clusterResult.body.apiSecret} />
      </div>
      <div>
        <h2 className="text-xl">Quick Start</h2>
        <div className="py-4 flex space-x-4">
          <div className="bg-gray-800 p-4 rounded-md flex-1">
            <div className="mb-4">
              <p className="text-gray-400 mt-2 text-xl">
                Run the test db service
              </p>
              <p>
                This service runs a small DB on your computer. Copy this code
                and paste it in your terminal.
              </p>
              <p>
                It will create a new directory with a small service that
                interacts with your cluster.
              </p>
            </div>
            <div className="pb-2">
              <CopyButton
                script={script(
                  clusterResult.body.id,
                  clusterResult.body.apiSecret,
                )}
              />
            </div>
            <div className="">
              <SyntaxHighlighter language="javascript" style={dark}>
                {script(
                  clusterResult.body.id,
                  clusterResult.body.apiSecret.slice(0, 10).concat("***"),
                )}
              </SyntaxHighlighter>
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-md flex-1">
            <div className="mb-4">
              <p className="text-gray-400 mt-2 text-xl">
                Call the started service
              </p>
              <p>
                This curl will interact with the service you just ran. Normally,
                you&apos;ll build a client with d.client(). But this is a quick
                way to test your cluster.
              </p>
              <p>
                Monitor your cluster{" "}
                <Link
                  href={`/clusters/${clusterResult.body.id}/monitoring`}
                  className="underline"
                >
                  here
                </Link>{" "}
                to see the service in action.
              </p>
            </div>
            <div className="pb-2">
              <CopyButton
                script={curl(
                  clusterResult.body.id,
                  clusterResult.body.apiSecret,
                ).replaceAll("\n\t", "")}
              />
            </div>
            <div>
              <SyntaxHighlighter language="bash" style={dark}>
                {curl(
                  clusterResult.body.id,
                  clusterResult.body.apiSecret.slice(0, 10).concat("***"),
                )}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-xl mb-4">Cluster Stats</h2>
        <div className="flex">
          {info.map((i) => (
            <div
              key={i.key}
              className="flex flex-col bg-slate-800 rounded-md p-4 w-72 mr-2"
            >
              <p className="text-gray-400">{i.key}</p>
              <h3 className="text-xl">{i.value}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
