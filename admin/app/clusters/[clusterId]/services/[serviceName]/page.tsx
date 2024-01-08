import { client } from "@/client/client";
import { auth } from "@clerk/nextjs";
import { ServiceLiveTables } from "./ServiceLiveTables";

export default async function Page({ params }: { params: { clusterId: string, serviceName: string } }) {
  const { getToken } = await auth();

  const token = await getToken();

  if (!token) {
    return null;
  }

  const clusterResult = await client.getClusterDetailsForUser({
    headers: {
      authorization: `Bearer ${token}`,
    },
    params: {
      clusterId: params.clusterId,
    },
  });

  if (clusterResult.status !== 200) {
    return null;
  }

  return (
    <section className="flex w-full h-full px-8 mt-8 mb-2 flex-col">
      <div className="flex flex-col">
        <p className="text-gray-400">Differential Service</p>
        <h1 className="text-2xl font-mono">{params.serviceName}</h1>
      </div>

      <ServiceLiveTables token={token} clusterId={params.clusterId} serviceName={params.serviceName} />
    </section>
  );
}
