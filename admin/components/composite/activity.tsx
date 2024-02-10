import { contract } from "@/client/contract";
import { ServerInferResponses } from "@ts-rest/core";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type Activity = ServerInferResponses<
  typeof contract.getActivity,
  200
>["body"][0] & {
  meta?: any;
};

const typeToText: { [key: string]: (activity: Activity) => string } = {
  jobCreated: () => "Received by control plane. Waiting for execution.",
  jobStatusRequest: () => `Caller asked for the status of the job.`,
  jobReceived: () =>
    `Function was received by the machine for execution. Execution was queued in the local task queue.`,
  jobResulted: () =>
    `Function execution succeeded. Result was sent to the control plane.`,
};

export function Activity({
  activity,
  previousActivity,
}: {
  activity: Activity;
  previousActivity?: Activity;
}) {
  const [expanded, setExpanded] = useState(false);

  const meta = activity.meta;

  const parser = typeToText[activity.type] ?? (() => activity.type);

  const text = parser(activity);

  if (!text) {
    console.warn(`Unknown activity type: ${activity.type}`);
  }

  return (
    <div className="flex flex-col mb-4">
      <div className="flex p-1 border border-slate-700 border-t-slate-500 rounded-md items-center space-x-4">
        <p className="font-mono text-sm ml-2 mr-2 text-slate-500">
          {new Date(activity.timestamp).toISOString()}
        </p>
        <div className="flex space-x-4 items-center">
          <p>{text ?? activity.type}</p>
        </div>
        <div className="flex-grow">
          <div className="flex-row space-x-2 my-2">
            {activity.machineId ? (
              <Badge variant="secondary">machine:{activity.machineId}</Badge>
            ) : null}
            {meta?.status ? (
              <Badge
                variant="secondary"
                className={
                  meta?.status === "success"
                    ? `bg-green-700`
                    : meta?.status === "running"
                      ? `bg-yellow-700`
                      : meta?.status === "pending"
                        ? `bg-slate-700`
                        : `bg-red-700`
                }
              >
                status:{meta?.status}
              </Badge>
            ) : null}
            {meta?.resultType ? (
              <Badge
                variant="secondary"
                className={
                  meta?.resultType === "resolution"
                    ? `bg-green-700`
                    : `bg-red-700`
                }
              >
                promise_result:
                {meta?.resultType === "resolution" ? "resolved" : "rejected"}
              </Badge>
            ) : null}
          </div>
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
      <div>
        {expanded ? (
          <div className="p-4 bg-slate-700 mt-4 rounded-md">
            <pre>{JSON.stringify({ ...activity, meta }, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
