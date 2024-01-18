"use client";

import { client } from "@/client/client";
import { contract } from "@/client/contract";
import { useAuth } from "@clerk/nextjs";
import { formatRelative } from "date-fns";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { DataTable } from "../../../../../components/ui/DataTable";
import { functionStatusToCircle } from "../../helpers";

export function ServiceLiveTables({
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
    z.infer<(typeof contract.getClusterServiceDetailsForUser.responses)["200"]>
  >({
    jobs: [],
    definition: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      const clusterResult = await client.getClusterServiceDetailsForUser({
        headers: {
          authorization: `Bearer ${await getToken()}`,
        },
        params: {
          clusterId,
          serviceName: serviceName,
        },
      });

      if (clusterResult.status === 401) {
        window.location.reload();
      }

      if (clusterResult.status === 200) {
        setData(clusterResult.body);
      } else {
        toast.error("Failed to fetch cluster details.");
      }
    };

    // initial fetch
    fetchData();
  }, [token, clusterId, serviceName, isLoaded, isSignedIn, getToken]);

  const path = usePathname();

  const searchParams = useSearchParams();

  const jobId = searchParams.get("jobId");

  return (
    <div>
      <div>
        <div className="mt-12">
          <h2 className="text-xl mb-4">Function Registry</h2>
          <p className="text-gray-400 mb-8">
            Currently registered functions for this service.
          </p>
          <DataTable
            data={
              data.definition?.functions?.map((s) => ({
                Function: s.name,
                Idempotent: s.idempotent ? "Yes" : "No",
                "Rate Limit":
                  s.rate === null || s.rate === undefined
                    ? "N/A"
                    : `${s.rate?.limit}/${s.rate?.per}`,
                "Cache TTL":
                  s.cacheTTL === null || s.cacheTTL === undefined
                    ? "N/A"
                    : `${s.cacheTTL}s`,
              })) ?? []
            }
            noDataMessage="No functions have been detected recently."
          />
        </div>
        <div className="mt-12">
          <h2 className="text-xl mb-4">Function calls</h2>
          <p className="text-gray-400 mb-8">
            Last {data.jobs.length} completed function calls to this service.
          </p>
          <DataTable
            data={data.jobs
              .sort((a, b) => {
                return a.createdAt > b.createdAt ? -1 : 1;
              })
              .map((s) => ({
                jobId: s.id,
                targetFn: s.targetFn,
                status: s.status,
                resolution: s.resultType ?? "N/A",
                createdAt: formatRelative(new Date(s.createdAt), new Date()),
                "Execution Time":
                  s.functionExecutionTime === null
                    ? "N/A"
                    : `${s.functionExecutionTime}ms`,
              }))}
            noDataMessage="No services with function calls have been detected in the cluster lately."
            columnDef={[
              {
                accessorKey: "jobId",
                header: "Execution ID",
                cell: ({ row }) => {
                  const jobId: string = row.getValue("jobId");

                  return (
                    <Link
                      className="font-mono text-md underline"
                      href={`/clusters/${clusterId}/activity?jobId=${jobId}`}
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
                accessorKey: "resolution",
                header: "Result",
              },
              {
                accessorKey: "Execution Time",
                header: "Execution Time",
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
            pagination
          />
        </div>
      </div>
    </div>
  );
}
