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
  predictorRetryableResult: () =>
    `The promise has been rejected, predictive retries has deetermined the retryable status.`,
  deploymentResulted: (activity) => {
    if (activity.meta?.deploymentStatus === "active") {
      return `Deployment succeeded. Jobs will be scheduled for execution on the new machines.`;
    }
    return `Deployment failed. Jobs will not be scheduled for execution on the new machine.`;
  },
  deploymentNotified: () =>
    `Deployment provider was notified of pending jobs and will scale appropriately.`,
  deploymentInactivated: () =>
    `Deployment was inactivated. No new jobs will be scheduled for execution.`,
  deploymentInitiated: () =>
    `Deployment was initiated. New machines will be provisioned.`,
  jobStalled: () =>
    `Function execution did not complete within the expected time frame. The function is marked as stalled.`,
  jobRecovered: () =>
    `Function execution was recovered after being marked as stalled.`,
  jobStalledTooManyTimes: () =>
    `Function execution did not complete within the expected time frame too many times. The execution has resulted in a failure.`,
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

  const distanceToPreviousActivity =
    previousActivity?.type === activity.type ? `-mt-4 opacity-50` : ``;

  const aiGlowBorder = `border-2 border-blue-500 border-opacity-50 rounded-md shadow-sm shadow-blue-900 shadow-opacity-50 border-t-purple-500 border-opacity-50 rounded-md shadow-md shadow-purple-900 shadow-opacity-50`;
  const normalBorder = `border border-slate-700 border-t-slate-500 rounded-md`;

  return (
    <div className={`flex flex-col mb-4 ${distanceToPreviousActivity}`}>
      <div
        className={`flex p-1 border rounded-md items-center space-x-4 ${activity.type.includes("predict") ? aiGlowBorder : normalBorder}`}
      >
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
            {activity.deploymentId ? (
              <Badge variant="secondary">
                deploymentId:{activity.deploymentId}
              </Badge>
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
            {meta?.retryable !== undefined ? (
              <Badge
                variant="secondary"
                className={meta?.retryable ? `bg-green-700` : `bg-red-700`}
              >
                retryable:
                {meta?.retryable ? "true" : "false"}
              </Badge>
            ) : null}
            {meta?.machineCount !== undefined ? (
              <Badge variant="secondary">
                machineCount:{meta?.machineCount}
              </Badge>
            ) : null}
            {meta?.pendingJobs !== undefined ? (
              <Badge variant="secondary">pendingJobs:{meta?.pendingJobs}</Badge>
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
