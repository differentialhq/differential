"use client";

import { client } from "@/client/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Page({ params }: { params: { clusterId: string } }) {
  const clusterId = params.clusterId;

  const [settings, setSettings] = useState<{
    predictiveRetries: boolean;
  }>({
    predictiveRetries: false,
  });

  const [loaded, setLoaded] = useState(false);

  const { getToken, isLoaded, isSignedIn } = useAuth();

  const fetchData = useCallback(async () => {
    const clusterResult = await client.getClusterSettings({
      headers: {
        authorization: `Bearer ${await getToken()}`,
      },
      params: {
        clusterId,
      },
    });

    if (clusterResult.status !== 200) {
      toast.error(
        `Failed to fetch cluster settings. status=${clusterResult.status}`,
      );
    } else {
      setSettings({
        predictiveRetries: clusterResult.body.predictiveRetriesEnabled,
      });

      setLoaded(true);
    }
  }, [clusterId, getToken]);

  useEffect(() => {
    fetchData();
  }, [clusterId, fetchData]);

  return (
    <div className="flex flex-row mt-8 space-x-8">
      <div
        className="flex items-center space-x-2 justify-between border p-4 rounded-md"
        style={{ width: 800 }}
      >
        <div className="flex flex-col space-y-1">
          <div className="font-bold flex space-x-2">
            <p>Predictive Retries</p>
            <Badge variant="secondary">Beta</Badge>
          </div>
          <p className="text-gray-400">
            Enable predictive retries to automatically retry failed function
            calls - powered by AI ✨.
          </p>
        </div>
        <Switch
          style={{ opacity: loaded ? 1 : 0.1 }}
          checked={settings.predictiveRetries}
          onCheckedChange={async (checked) => {
            client
              .setClusterSettings({
                headers: {
                  authorization: `Bearer ${await getToken()}`,
                },
                params: {
                  clusterId,
                },
                body: {
                  predictiveRetriesEnabled: checked,
                },
              })
              .then((result) => {
                if (result.status !== 204) {
                  toast.error(
                    `Failed to update cluster settings. status=${result.status}`,
                  );
                } else {
                  setSettings({
                    predictiveRetries: checked,
                  });

                  toast.success("Updated cluster settings");
                }
              });
          }}
        />
      </div>
      <div
        className="flex items-center space-x-2 justify-between border p-4 rounded-md"
        style={{ width: 800 }}
      >
        <div className="flex flex-col space-y-1">
          <div className="font-bold flex space-x-2">
            <p>Differential Cloud</p>
            <Badge variant="secondary">Private Beta</Badge>
          </div>
          <p className="text-gray-400">
            Differential Cloud is a fully managed deployment of the open-source
            offering.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            (window.location.href = "https://forms.fillout.com/t/9M1VhL8Wxyus")
          }
        >
          Join the waitlist
        </Button>
      </div>
    </div>
  );
}
