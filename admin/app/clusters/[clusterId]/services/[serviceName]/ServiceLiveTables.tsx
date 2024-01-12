"use client";

import { client } from "@/client/client";
import { formatRelative } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DataTable } from "../../../../../components/ui/DataTable";
import { useAuth } from "@clerk/nextjs";

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

  const [data, setData] = useState<{
    jobs: {
      id: string;
      createdAt: Date;
      targetFn: string;
      service: string | null;
      status: string;
      resultType: string | null;
      functionExecutionTime: number | null;
    }[];
    service?: {
      name: string;
      functions?: Array<{
        name: string;
        idempotent?: boolean | null;
        rate?: { per: "minute" | "hour"; limit: number } | null;
        cacheTTL?: number | null;
      }>;
    };
  }>({
    jobs: [],
    service: undefined,
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
          jobs: clusterResult.body.jobs
            .filter((f) => f.service == serviceName)
            .slice(-10),
          service: clusterResult.body.definitions
            .filter((s) => s.name == serviceName)
            .pop(),
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
  }, [token, clusterId, serviceName, isLoaded, isSignedIn, getToken]);

  return (
    <div>
      {(data.service !== undefined && (
        <div>
          <div className="mt-12">
            <h2 className="text-xl mb-4">Function Registry</h2>
            <p className="text-gray-400 mb-8">
              These are the functions that are registered for this service.
            </p>
            <DataTable
              data={
                data.service.functions?.map((s) => ({
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
            <h2 className="text-xl mb-4">Live function calls</h2>
            {data.jobs.length > 0 && (
              <p className="text-gray-400 mb-8">
                These are the last {data.jobs.length} function calls that have
                been made to the cluster.
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
                  Resolution: s.resultType ?? "N/A",
                  Called: formatRelative(new Date(s.createdAt), new Date()),
                  "Execution Time":
                    s.functionExecutionTime === null
                      ? "N/A"
                      : `${s.functionExecutionTime}ms`,
                }))}
              noDataMessage="No services with function calls have been detected in the cluster lately."
            />
          </div>
        </div>
      )) || (
        <div className="mt-6">
          <p>Service {serviceName} does not have any recent data to display.</p>
        </div>
      )}
    </div>
  );
}
