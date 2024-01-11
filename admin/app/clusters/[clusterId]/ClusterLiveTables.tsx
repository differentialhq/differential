"use client";

import { client } from "@/client/client";
import { useAuth } from "@clerk/nextjs";
import { formatRelative } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DataTable } from "../../../components/ui/DataTable";
import { ServiceSummary } from "./services/ServiceSummary";

function LiveGreenCircle() {
  // a green circle that is green when the machine is live
  // with a green glow
  return (
    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
  );
}

function DeadGrayCircle() {
  // a gray circle that is gray when the machine is dead
  return <div className="w-4 h-4 rounded-full bg-gray-500"></div>;
}

export function ClusterLiveTables({
  token,
  clusterId,
}: {
  token: string;
  clusterId: string;
}) {
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
    services: Array<{
      name: string;
      functions: Array<{
        name: string;
        totalSuccess: number;
        totalFailure: number;
        avgExecutionTimeSuccess: number | null;
        avgExecutionTimeFailure: number | null;
      }>;
    }>;
    definitions: Array<{
      name: string;
      functions: Array<{
        name: string;
      }>;
    }>;
  }>({
    machines: [],
    jobs: [],
    services: [],
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
          services: clusterResult.body.services,
          definitions: clusterResult.body.definitions || [],
        });
      } else {
        toast.error("Failed to fetch cluster details.");
      }
    };

    // initial fetch
    fetchData();

    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(interval); // Clear the interval when the component unmounts
    };
  }, [token, clusterId, isLoaded, isSignedIn, getToken]);

  return (
    <div>
      <div className="mt-12">
        <h2 className="text-xl mb-4">Registered Services</h2>
        {data.definitions.length > 0 && (
          <p className="text-gray-400 mb-8">
            The following services have been registered in the cluster.
          </p>
        )}
        <div className="my-2">
          <ServiceSummary services={data.definitions} clusterId={clusterId} />
        </div>
      </div>
      <div className="mt-12">
        <h2 className="text-xl mb-4">Machine Status</h2>
        {data.machines.length > 0 && (
          <p className="text-gray-400 mb-8">
            These are all the machines that have connected to the cluster within
            the last hour.
          </p>
        )}
        <DataTable
          data={data.machines
            .sort((a, b) => (a.lastPingAt! > b.lastPingAt! ? -1 : 1))
            .map((s) => ({
              machineId: s.id,
              ip: s.ip,
              ping: `Seen ${formatRelative(
                new Date(s.lastPingAt!),
                new Date()
              )}`,
              status:
                new Date().getTime() - new Date(s.lastPingAt!).getTime() < 30000
                  ? "live"
                  : "dead",
            }))}
          noDataMessage="No machines have been detected in the cluster lately."
          columnDef={[
            {
              accessorKey: "machineId",
              header: "Machine ID",
            },
            {
              accessorKey: "ip",
              header: "IP Address",
            },
            {
              accessorKey: "ping",
              header: "Last Ping",
            },
            {
              accessorKey: "status",
              header: "Status",
              cell: ({ row }) => {
                const status = row.getValue("status");

                return status === "live" ? (
                  <LiveGreenCircle />
                ) : (
                  <DeadGrayCircle />
                );
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
