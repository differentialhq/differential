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

const typeToText: { [key: string]: string } = {
  RECEIVED_BY_CONTROL_PLANE:
    "Received by control plane. Waiting for execution.",
  JOB_STATUS_REQUESTED: `Execution status was returned to the caller.`,
  RECEIVED_BY_MACHINE: `Function was received by the machine for execution. Execution was queued in the local task queue.`,
  RESULT_SENT_TO_CONTROL_PLANE: `Function execution succeeded. Result was sent to the control plane.`,
};

export function Activity({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);

  const meta = activity.meta;

  return (
    <div className="flex flex-col mb-4">
      <div className="p-4 border border-slate-700 border-t-slate-500 rounded-md">
        <p className="font-mono text-xs mb-2">{activity.timestamp}</p>
        <div className="flex space-x-4 items-center">
          <p>{typeToText[activity.type]}</p>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
        <div>
          <div className="flex-row space-x-2 my-2">
            {activity.service ? (
              <Badge variant="secondary">service:{activity.service}</Badge>
            ) : null}
            {activity.machineId ? (
              <Badge variant="secondary">machine:{activity.machineId}</Badge>
            ) : null}
            {meta?.status ? (
              <Badge
                variant="secondary"
                className={meta?.status === "success" ? `bg-green-700` : ``}
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
        {expanded ? (
          <div className="p-4 bg-slate-700 mt-4 rounded-md">
            <pre>{JSON.stringify({ ...activity, meta }, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
