"use client";

import { client } from "@/client/client";
import { formatRelative } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DataTable } from "../../../components/ui/DataTable";
import { useAuth } from "@clerk/nextjs";
import { Card } from "flowbite-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        idempotent: boolean | null;
        rate: {per: 'minute' | 'hour', limit: number} | null;
        cacheTTL: number | null;
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
        <h2 className="text-xl mb-4">Registered Services</h2>
        {data.services.length > 0 && (
          <p className="text-gray-400 mb-8">
            The following services have been registered in the cluster. 
            Select for more details.
          </p>
        )}

        <div className="flex flex-wrap">
          {data.services
            ?.sort((a, b) => {
              return (
                b.functions.length -
                a.functions.length
              );
            })
            .map((service, i) => (
              <a
                href={`/clusters/${clusterId}/services/${service.name}`}
                className="mr-4 mb-4 w-96"
                key={i}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      {`Registered Functions: ${service.functions.length}`}
                    </p>
                  </CardContent>
                </Card>
              </a>
            ))}
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
