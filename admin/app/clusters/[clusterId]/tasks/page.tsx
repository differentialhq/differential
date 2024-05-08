"use client";

import { client } from "@/client/client";
import { DataTable } from "@/components/ui/DataTable";
import { useAuth } from "@clerk/nextjs";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { formatRelative } from "date-fns";
import { useEffect, useState } from "react";
import { Dot } from "react-animated-dots";
import toast from "react-hot-toast";
import { functionStatusToCircle } from "../helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page({ params }: { params: { clusterId: string } }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [data, setData] = useState<{
    loading: boolean;
    taskId: string | null;
    result: string | null;
    jobs: {
      id: string;
      createdAt: Date;
      targetFn: string;
      status: string;
      functionExecutionTime: number | null;
    }[];
  }>({
    loading: false,
    taskId: null,
    result: null,
    jobs: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!data.taskId) {
        return;
      }

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
          loading: data.loading,
          taskId: data.taskId,
          result: data.result,
          jobs: clusterResult.body.jobs,
        });
      } else {
        toast.error("Failed to fetch cluster details.");
      }
    };

    const interval = setInterval(fetchData, 500); // Refresh every 500ms

    return () => {
      clearInterval(interval); // Clear the interval when the component unmounts
    };
  }, [params.clusterId, isLoaded, isSignedIn, getToken, data]);

  return (
    <div className="flex flex-row mt-8 space-x-12 mb-12">
      <div className="flex-grow">
        <h2 className="text-xl mb-4">Execute Agent Task</h2>
        <p className="text-gray-400 mb-8">
          Prompt the cluster to execute a task.
        </p>
        <div className="flex flex-row space-x-4 mb-2">
          <input
            type="text"
            placeholder="Enter your task prompt here"
            disabled={data.loading || data.taskId !== null}
            className="flex-grow p-2 rounded-md bg-blue-400 placeholder-blue-200 text-white"
            id="prompt"
          />
          <Button
            size="sm"
            disabled={data.loading || data.taskId !== null}
            onClick={async () => {
              setData({
                loading: true,
                taskId: null,
                result: null,
                jobs: [],
              });

              const taskPrompt = (
                document.getElementById("prompt") as HTMLInputElement
              ).value;

              const result = await client.executeTask({
                headers: {
                  authorization: `Bearer ${getToken()}`,
                },
                params: {
                  clusterId: params.clusterId,
                },
                body: {
                  task: taskPrompt,
                },
              });

              if (result.status === 200) {
                setData({
                  loading: false,
                  taskId: result.body.taskId,
                  result: result.body.result,
                  jobs: data.jobs,
                });
              } else {
                setData({
                  loading: false,
                  taskId: null,
                  result: "Failed to execute task",
                  jobs: data.jobs,
                });
              }
            }}
          >
            Execute
          </Button>
        </div>
        {data.result && (
          <div className="flex-grow rounded-md border mb-4 p-4">
            <pre>{data.result}</pre>
          </div>
        )}
        {data.loading && (
          <div className="flex-grow rounded-md border mb-4 p-4">
            <Dot>.</Dot>
            <Dot>.</Dot>
            <Dot>.</Dot>
          </div>
        )}
        <ScrollArea className="rounded-md border" style={{ height: 400 }}>
          <DataTable
            data={data.jobs
              .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
              .filter((s) => s.id.startsWith(data.taskId || ""))
              .map((s) => ({
                jobId: s.id,
                targetFn: s.targetFn,
                status: s.status,
                createdAt: formatRelative(new Date(s.createdAt), new Date()),
                functionExecutionTime: s.functionExecutionTime,
              }))}
            noDataMessage="No functions have been performed as part of the task."
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
