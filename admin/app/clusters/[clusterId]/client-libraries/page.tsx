"use client";

import { client } from "@/client/client";
import { DataTable } from "@/components/ui/DataTable";
import { useAuth } from "@clerk/nextjs";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { formatRelative } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { clipboardSvg } from "@/components/ui/clipboard-button";

const SCOPE = "@differential.dev";
export default function Page({ params }: { params: { clusterId: string } }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [data, setData] = useState<{
    versions: {
      id: string;
      version: string;
      uploadedAt: Date;
    }[];
  }>({
    versions: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const clusterResult = await client.getClientLibraryVersions({
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
          versions: clusterResult.body,
        });
      } else {
        toast.error("Failed to fetch client library details.");
      }
    };

    // initial fetch
    fetchData();

    const interval = setInterval(fetchData, 2000); // Refresh every 2 seconds

    return () => {
      clearInterval(interval); // Clear the interval when the component unmounts
    };
  }, [params.clusterId, isLoaded, isSignedIn, getToken]);

  return (
    <div className="flex flex-row mt-8 space-x-12 mb-14">
      <div className="flex-grow" style={{ minWidth: 500 }}>
        <h2 className="text-xl mb-4">Available Client Library Versions</h2>
        <ScrollArea className="rounded-md mt-8" style={{ height: 400 }}>
          <DataTable
            data={data.versions.map((version) => {
              console.log(version);
              return {
                version: version.version,
                published_at: formatRelative(version.uploadedAt, new Date()),
                package: `${SCOPE}/${params.clusterId}@${version.version}`,
                package_install: `npm install ${SCOPE}/${params.clusterId}@${version.version}`,
              };
            })}
            noDataMessage="No client libraries have been published for this cluster."
            columnDef={[
              {
                accessorKey: "version",
                header: "Version",
              },
              {
                accessorKey: "published_at",
                header: "Published At",
              },
              {
                accessorKey: "package",
                header: "Package Name",
              },
              {
                accessorKey: "package_install",
                header: "Package Install",
                cell: (row) => (
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        row.cell.getValue() as string,
                      );
                      toast.success("Copied to clipboard");
                    }}
                    color="blue"
                  >
                    {clipboardSvg()}
                  </Button>
                ),
              },
            ]}
          />
        </ScrollArea>
      </div>
    </div>
  );
}
