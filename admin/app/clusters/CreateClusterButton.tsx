"use client";

import { client } from "@/client/client";
import { Button } from "flowbite-react";
import { useEffect } from "react";
import { toast } from "react-hot-toast";

export const CreateClusterButton = ({ token }: { token: string }) => {
  return (
    <Button
      size="lg"
      gradientDuoTone="greenToBlue"
      className="max-w-48"
      onClick={async () => {
        await toast.promise(
          (async () => {
            // wait for 2 seconds for toast to show
            await new Promise((resolve) => setTimeout(resolve, 2000));

            await client.createClusterForUser({
              headers: {
                authorization: `Bearer ${token}`,
              },
              body: {
                description: "",
              },
            });
          })(),
          {
            loading: "Creating a cluster...",
            success: "Successfully created a cluster!",
            error: "Failed to create a cluster.",
          }
        );

        // wait for 2 seconds for toast to show
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // reload the page
        window.location.reload();
      }}
    >
      Create a Cluster
    </Button>
  );
};
