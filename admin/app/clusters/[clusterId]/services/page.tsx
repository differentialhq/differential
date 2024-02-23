"use client";

import { client } from "@/client/client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ServiceSummary } from "./ServiceSummary";

export default function Page({ params }: { params: { clusterId: string } }) {
  const clusterId = params.clusterId;

  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [data, setData] = useState<{
    machines: {
      id: string;
      lastPingAt: Date | null;
      ip: string | null;
    }[];
    jobs: {
      id: string;
      createdAt: Date;
      targetFn: string;
      status: string;
      functionExecutionTime: number | null;
    }[];
    definitions: Array<{
      name: string;
      functions?: Array<{
        name: string;
      }>;
    }>;
  }>({
    machines: [],
    jobs: [],
    definitions: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const clusterResult = await client.getClusterDetailsForUser({
        headers: {
          authorization: `Bearer ${await getToken()}`,
        },
        params: {
          clusterId,
        },
      });

      if (clusterResult.status === 401) {
        window.location.reload();
      }

      if (clusterResult.status === 200) {
        setData({
          machines: clusterResult.body.machines,
          jobs: clusterResult.body.jobs,
          definitions: clusterResult.body.definitions,
        });
      } else {
        toast.error("Failed to fetch cluster details.");
      }
    };

    // initial fetch
    fetchData();

    const interval = setInterval(fetchData, 2000); // Refresh every 2 seconds

    return () => {
      clearInterval(interval); // Clear the interval when the component unmounts
    };
  }, [clusterId, isLoaded, isSignedIn, getToken]);

  return (
    <div className="py-8 flex space-y-16 flex-col">
      <div>
        <h2 className="text-xl mb-4">Registered Services</h2>
        {data.definitions.length > 0 ? (
          <p className="text-gray-400 mb-8">
            The following services have been registered in the cluster.
          </p>
        ) : (
          <p className="text-gray-400 mb-8">
            No services have been registered.
          </p>
        )}
        <div className="my-2">
          <ServiceSummary services={data.definitions} clusterId={clusterId} />
        </div>
      </div>
    </div>
  );
}
