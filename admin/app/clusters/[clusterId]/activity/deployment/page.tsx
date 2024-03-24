"use client";

import { client } from "@/client/client";
import { contract } from "@/client/contract";
import { Activity } from "@/components/composite/activity";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { ServerInferResponses } from "@ts-rest/core";
import { ActivityIcon, ChevronLeft, TerminalIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "react-json-pretty/themes/acai.css";
type ActivityStreamDataSuccess = ServerInferResponses<
  typeof contract.getActivity,
  200
>["body"];

export default function Page({ params }: { params: { clusterId: string } }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const searchParams = useSearchParams();

  const deploymentId = searchParams.get("deploymentId");

  const [data, setData] = useState<ActivityStreamDataSuccess | null>();

  useEffect(() => {
    if (!deploymentId) {
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
          deploymentId,
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
  }, [isLoaded, isSignedIn, getToken, deploymentId, params.clusterId]);

  const sorted = data?.toSorted((a, b) =>
    new Date(a.timestamp) < new Date(b.timestamp) ? 1 : -1,
  );

  return (
    <section className="flex w-full h-full px-8 mt-8 mb-2 flex-col">
      <div className="mb-8">
        <a className="text-gray-400" onClick={() => window.history.back()}>
          <Button variant="secondary">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </a>
      </div>
      <div className="flex flex-col">
        <p className="text-gray-400">Cluster Activity</p>
        <h1 className="text-2xl font-mono">deploymentId={deploymentId}</h1>
      </div>
      <div className="mt-12">
        <h2 className="text-xl">Activity Log</h2>
        <p className="text-gray-400 mt-2">Activity log for the deployment.</p>
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
