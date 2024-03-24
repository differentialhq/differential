"use client";

import { client } from "@/client/client";
import { contract } from "@/client/contract";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { DataTable } from "../../../../../components/ui/DataTable";
import { formatRelative } from "date-fns";
import { deploymentStatusToCircle } from "../../helpers";
import Link from "next/link";

export function ServiceDeployments({
  token,
  clusterId,
  serviceName,
}: {
  token: string;
  clusterId: string;
  serviceName: string;
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [data, setData] = useState<
    z.infer<(typeof contract.getDeployments.responses)["200"]>
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await client.getDeployments({
        headers: {
          authorization: `Bearer ${await getToken()}`,
        },
        params: {
          clusterId,
          serviceName: serviceName,
        },
      });

      if (result.status === 401) {
        window.location.reload();
      }

      if (result.status === 200) {
        setData(
          result.body.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)),
        );
      } else {
        toast.error("Failed to fetch deployment details.");
      }
    };

    // initial fetch
    fetchData();
  }, [token, clusterId, serviceName, isLoaded, isSignedIn, getToken]);

  return data.length ? (
    <div>
      <div>
        <div className="mt-12">
          <h2 className="text-xl mb-4">Cloud Deployments</h2>
          <p className="text-gray-400 mb-8">
            Differential Cloud deployments for this service.
          </p>
          <DataTable
            data={
              data.map((d) => ({
                id: d.id,
                provider: d.provider,
                deployedAt: d.createdAt,
                status: d.status,
              })) || []
            }
            columnDef={[
              {
                accessorKey: "id",
                header: "Deployment ID",
                cell: ({ row }) => {
                  const deploymentId: string = row.getValue("id");

                  return (
                    <Link
                      className="font-mono text-md underline"
                      href={`/clusters/${clusterId}/activity/deployment?deploymentId=${deploymentId}`}
                    >
                      {deploymentId.substring(deploymentId.length - 6)}
                    </Link>
                  );
                },
              },
              {
                accessorKey: "provider",
                header: "Provider",
              },
              {
                accessorKey: "deployedAt",
                header: "Deployed At",
                cell: ({ row }) => {
                  const date = row.getValue("deployedAt") as Date;
                  return formatRelative(new Date(date), new Date());
                },
              },
              {
                accessorKey: "status",
                header: "",
                cell: ({ row }) => {
                  const status = row.getValue("status");
                  return deploymentStatusToCircle(status as string);
                },
              },
            ]}
          />
        </div>
      </div>
    </div>
  ) : null;
}
