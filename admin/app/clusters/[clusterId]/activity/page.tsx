"use client";

import { client } from "@/client/client";
import { contract } from "@/client/contract";
import { Activity } from "@/components/composite/activity";
import { useAuth } from "@clerk/nextjs";
import { ServerInferResponses } from "@ts-rest/core";
import {
  ActivityIcon,
  BarChart2Icon,
  FastForwardIcon,
  TerminalIcon,
  ZapIcon,
} from "lucide-react";
import { unpack } from "msgpackr/unpack";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "react-json-pretty/themes/acai.css";
import {
  DeadGreenCircle,
  DeadRedCircle,
  LiveAmberCircle,
  LiveGreenCircle,
} from "../helpers";

type ActivityStreamDataSuccess = ServerInferResponses<
  typeof contract.getActivity,
  200
>["body"];

const resultTypeIcon: { [key: string]: JSX.Element } = {
  resolution: <DeadGreenCircle />,
  rejection: <DeadRedCircle />,
};

const statusIcon: { [key: string]: JSX.Element } = {
  success: <DeadGreenCircle />,
  pending: <LiveAmberCircle />,
  running: <LiveGreenCircle />,
  failure: <DeadRedCircle />,
};

export default function Page({ params }: { params: { clusterId: string } }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const searchParams = useSearchParams();

  const jobId = searchParams.get("jobId");

  const [data, setData] = useState<ActivityStreamDataSuccess | null>();

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const fetchData = async () => {
      const activity = await client.getActivity({
        headers: {
          authorization: `Bearer ${await getToken()}`,
        },
        params: {
          clusterId: params.clusterId,
        },
        query: {
          jobId: jobId,
        },
      });

      if (activity.status === 401) {
        window.location.reload();
      }

      if (activity.status === 200) {
        setData(activity.body);
      } else {
        toast.error("Failed to fetch activity steam.");
      }
    };

    // initial fetch
    fetchData();

    const interval = setInterval(fetchData, 10000);

    return () => {
      clearInterval(interval); // Clear the interval when the component unmounts
    };
  }, [isLoaded, isSignedIn, getToken, jobId, params.clusterId]);

  const sorted = data?.toSorted((a, b) => (a.timestamp > b.timestamp ? 1 : -1));

  const reversed = sorted?.toReversed();

  const service = reversed?.find((activity) => activity.service)?.service;

  const runnerMachineId = reversed?.find(
    (activity) => activity.machineId,
  )?.machineId;

  const getAttribute = (activities: typeof reversed, key: string) => {
    const lastActivityWithValue = activities?.find((activity) =>
      activity.meta ? ((activity.meta || {}) as any)[key] : undefined,
    );

    return lastActivityWithValue
      ? (lastActivityWithValue.meta as any)[key]
      : undefined;
  };

  const targetFn = getAttribute(reversed, "targetFn");

  const targetArgs = getAttribute(reversed, "targetArgs");

  const result = getAttribute(reversed, "result");

  const resultType = getAttribute(reversed, "resultType");

  const status = getAttribute(reversed, "status");

  const meta = [
    {
      icon: <ActivityIcon />,
      heading: "Service",
      value: service,
    },
    {
      icon: <ZapIcon />,
      heading: "Runner Machine",
      value: runnerMachineId,
    },
    {
      heading: "Result Type",
      value: resultType,
      icon: <FastForwardIcon />,
      post: resultType ? resultTypeIcon[resultType] : null,
    },
    {
      heading: "Status",
      value: status,
      icon: <BarChart2Icon />,
      post: status ? statusIcon[status] : null,
    },
    {
      heading: "Function",
      value: targetFn,
      icon: <TerminalIcon />,
    },
  ].filter(({ value }) => value);

  return (
    <section className="flex w-full h-full mt-8 mb-2 flex-col">
      <div className="flex flex-col">
        <p className="text-gray-400">Cluster Activity</p>
        <h1 className="text-2xl font-mono">jobId={jobId}</h1>
      </div>
      <div className="mt-12 mb-12">
        <h2 className="text-xl">Metadata</h2>
        <div className="flex flex-row flex-wrap mt-4">
          {meta.map(({ heading, value, icon, post }) => (
            <div
              key={heading}
              className="p-4 border border-slate-700 border-t-slate-500 rounded-md mr-4 mb-4 w-96"
            >
              <p className="flex items-center space-x-2 mb-2">
                <span>{icon ? icon : null}</span>
                <span>{heading}</span>
              </p>
              <p className="font-mono flex items-center space-x-2">
                <span>{value}</span>
                <span>{post}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="flex space-x-4 mt-4">
          <div className="flex-1">
            <h2 className="text-xl mb-4">Input</h2>
            <div className="p-4 border border-slate-700 border-t-slate-500 rounded-md mr-4 mb-4 w-full h-full">
              <pre>
                {targetArgs
                  ? JSON.stringify(
                      unpack(Buffer.from(targetArgs, "base64")),
                      null,
                      2,
                    )
                  : undefined}
              </pre>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl mb-4">Output</h2>
            <div className="p-4 border border-slate-700 border-t-slate-500 rounded-md mr-4 mb-4 h-full">
              <pre className="text-wrap">
                {result
                  ? JSON.stringify(
                      unpack(Buffer.from(result, "base64")),
                      null,
                      2,
                    )
                  : undefined}
              </pre>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12">
        <h2 className="text-xl">Activity Log</h2>
        <p className="text-gray-400 mt-2">Activity log for the job.</p>
        <div className="mt-6">
          {sorted?.map((activity, i) => (
            <div key={new Date(activity.timestamp).toISOString()}>
              <Activity activity={activity} previousActivity={sorted[i - 1]} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
