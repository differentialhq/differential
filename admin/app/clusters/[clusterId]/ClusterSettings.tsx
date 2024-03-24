"use client";

import { client } from "@/client/client";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export function ClusterSettings({ clusterId }: { clusterId: string }) {
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
    <div className="flex items-center space-x-2 justify-between border p-4 rounded-md">
      <div>
        <p className="font-bold">Predictive Retries</p>
        <p className="text-gray-400">
          Automatically retry promise rejections based on the error context
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
  );
}
