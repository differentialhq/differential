import { client } from "@/client/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@clerk/nextjs";
import { formatRelative } from "date-fns";
import { CreateClusterButton } from "./CreateClusterButton";

export default async function Page() {
  const { getToken } = await auth();

  const token = await getToken();

  if (!token) {
    return null;
  }

  const clusterResult = await client.getClustersForUser({
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (clusterResult.status !== 200) {
    return null;
  }

  return (
    <section className="flex w-full h-full px-8 mt-8 mb-2 flex-col">
      <div>
        <h1 className="text-2xl mb-2">My Clusters</h1>
        <p className="mb-4">
          Clusters are groups of services that you connect together to create
          more complex applications.
        </p>
        <CreateClusterButton token={token} />
      </div>
      <div className="mt-8">
        {clusterResult.body?.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full h-full p-8 border border-dashed rounded-lg">
            <p>You do not have any clusters yet. Create one to get started.</p>
          </div>
        )}
        <div className="flex flex-wrap">
          {clusterResult.body
            ?.sort((a, b) => {
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            })
            .map((cluster, i) => (
              <a
                href={`/clusters/${cluster.id}/overview`}
                className="mr-4 mb-4 w-96"
                key={i}
              >
                <Card
                  className={`bg-gradient-to-br from-gray-900 to-gray-950 hover:from-gray-800 hover:-mt-1`}
                >
                  <CardHeader>
                    <CardTitle>{`${cluster.id.split("-")[1]}-${
                      cluster.id.split("-")[2]
                    }`}</CardTitle>
                    <CardDescription>{cluster.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Created{" "}
                      {formatRelative(new Date(cluster.createdAt), new Date())}
                    </p>
                  </CardContent>
                </Card>
              </a>
            ))}
        </div>
      </div>
    </section>
  );
}
