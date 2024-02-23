import { client } from "@/client/client";
import { auth } from "@clerk/nextjs";
import { SecretKeyReveal } from "../SecretKeyReveal";

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
  ];

  return (
    <div className="py-8 flex space-y-16 flex-col">
      <div>
        <h2 className="text-xl">Secret Keys</h2>
        <p className="text-gray-400 mt-2">
          These keys are used to authenticate with the cluster. They should be
          kept secret.
        </p>
        <SecretKeyReveal secretKey={clusterResult.body.apiSecret} />
      </div>
      <div>
        <h2 className="text-xl mb-4">Cluster Stats</h2>
        <div className="grid grid-cols-4 gap-4">
          {info.map((i) => (
            <div
              key={i.key}
              className="flex flex-col bg-slate-800 rounded-md p-4"
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
