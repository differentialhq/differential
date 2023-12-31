"use client";

import { client } from "@/client/client";
import { formatRelative } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DataTable } from "./DataTable";
import { useAuth } from "@clerk/nextjs";

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

export function LiveTables({
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
  }>({
    machines: [],
    jobs: [],
    services: [],
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
        <h2 className="text-xl">Machine Status</h2>
        {data.machines.length > 0 && (
          <p className="text-gray-400 mb-8 mt-2">
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
      <div className="mt-12">
        <h2 className="text-xl">Live function calls</h2>
        {data.jobs.length > 0 && (
          <p className="text-gray-400 mb-8 mt-2">
            These are the last {data.jobs.length} function calls that have been
            made to the cluster.
          </p>
        )}
        <DataTable
          data={data.jobs
            .sort((a, b) => {
              return a.createdAt > b.createdAt ? -1 : 1;
            })
            .map((s) => ({
              "Execution id": s.id,
              Function: s.targetFn,
              Status: s.status,
              Called: formatRelative(new Date(s.createdAt), new Date()),
              "Execution Time":
                s.functionExecutionTime === null
                  ? "N/A"
                  : `${s.functionExecutionTime}ms`,
            }))}
          noDataMessage="No services with function calls have been detected in the cluster lately."
        />
      </div>

      <div className="mt-12">
        {data.services.map((service) => (
            <div className="mt-12" key={service.name}>
            <h1 className="text-lg">Service: {service.name}</h1>
            <p className="text-gray-400 mb-8 mt-2">
              These are the {service.functions.length} functions registered on the {service.name} service.
            </p>
            <DataTable
              data={service.functions.map((s) => ({
                Function: s.name,
                "Total Requests": s.totalSuccess + s.totalFailure,
                "Failure Rate": `${((s.totalFailure / (s.totalSuccess + s.totalFailure)) * 100).toFixed(2)}%`,
                "Average Execution Time (Success)": `${s.avgExecutionTimeSuccess === undefined ? "N/A" : `${s.avgExecutionTimeSuccess?.toFixed(2)}ms`}`,
                "Average Execution Time (Failure)": `${s.avgExecutionTimeFailure === undefined ? "N/A" : `${s.avgExecutionTimeFailure?.toFixed(2)}ms`}`,
              }))}
              noDataMessage="No services have been detected in the cluster lately."
            />
            </div>
        ))
        }
      </div>
    </div>
  );
}
