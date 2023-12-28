import { client } from "@/client/client";
import { auth } from "@clerk/nextjs";
import { CreateClusterButton } from "./CreateClusterButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, formatDistance, formatRelative, subDays } from "date-fns";

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
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl">My Clusters</h1>
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
                href={`/clusters/${cluster.id}`}
                className="mr-4 mb-4 w-96"
                key={i}
              >
                <Card>
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
