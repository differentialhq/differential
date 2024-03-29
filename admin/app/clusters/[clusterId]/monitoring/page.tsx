"use client";

import { client } from "@/client/client";
import { DataTable } from "@/components/ui/DataTable";
import { useAuth } from "@clerk/nextjs";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { formatRelative } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  DeadGrayCircle,
  LiveGreenCircle,
  functionStatusToCircle,
} from "../helpers";
import Link from "next/link";

export default function Page({ params }: { params: { clusterId: string } }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [data, setData] = useState<{
    machines: {
      id: string;
      lastPingAt: Date | null;
      ip: string | null;
      deploymentId: string | null;
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
          clusterId: params.clusterId,
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
  }, [params.clusterId, isLoaded, isSignedIn, getToken]);

  return (
    <div className="flex flex-row mt-8 space-x-12 mb-12">
      <div className="flex-shrink" style={{ minWidth: 500 }}>
        <h2 className="text-xl mb-4">Machine Status</h2>
        <p className="text-gray-400 mb-8">
          Recently active machines in the cluster.
        </p>
        <ScrollArea className="rounded-md border" style={{ height: 400 }}>
          <DataTable
            data={data.machines
              .sort((a, b) => (a.lastPingAt! > b.lastPingAt! ? -1 : 1))
              .map((s) => ({
                machineId: s.id,
                ip: s.ip,
                deploymentId: s.deploymentId,
                ping: formatRelative(new Date(s.lastPingAt!), new Date()),
                status:
                  new Date().getTime() - new Date(s.lastPingAt!).getTime() <
                  30000
                    ? "live"
                    : "dead",
              }))}
            noDataMessage="No machines have been detected in the cluster lately."
            columnDef={[
              {
                accessorKey: "machineId",
                header: "Machine ID",
                cell: ({ row }) => {
                  const machineId = row.getValue("machineId");

                  return (
                    <p className="font-mono text-sm">{machineId as string}</p>
                  );
                },
              },
              {
                accessorKey: "ip",
                header: "IP",
              },
              {
                accessorKey: "deploymentId",
                header: "Cloud Deployment",
              },
              {
                accessorKey: "ping",
                header: "Last Ping",
              },
              {
                accessorKey: "status",
                header: "",
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
        </ScrollArea>
      </div>
      <div className="flex-grow">
        <h2 className="text-xl mb-4">Live Cluster Activity</h2>
        <p className="text-gray-400 mb-8">
          Currently active and recently completed functions.
        </p>
        <ScrollArea className="rounded-md border" style={{ height: 400 }}>
          <DataTable
            data={data.jobs
              .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
              .map((s) => ({
                jobId: s.id,
                targetFn: s.targetFn,
                status: s.status,
                createdAt: formatRelative(new Date(s.createdAt), new Date()),
                functionExecutionTime: s.functionExecutionTime,
              }))}
            noDataMessage="No functions have been detected in the cluster lately."
            columnDef={[
              {
                accessorKey: "jobId",
                header: "Execution ID",
                cell: ({ row }) => {
                  const jobId: string = row.getValue("jobId");

                  return (
                    <Link
                      className="font-mono text-md underline"
                      href={`/clusters/${params.clusterId}/activity?jobId=${jobId}`}
                    >
                      {jobId.substring(jobId.length - 6)}
                    </Link>
                  );
                },
              },
              {
                accessorKey: "targetFn",
                header: "Function",
              },
              {
                accessorKey: "createdAt",
                header: "Called",
              },
              {
                accessorKey: "status",
                header: "",
                cell: ({ row }) => {
                  const status = row.getValue("status");

                  return functionStatusToCircle(status as string);
                },
              },
            ]}
          />
        </ScrollArea>
      </div>
    </div>
  );
}
