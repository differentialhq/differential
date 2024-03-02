"use client";

import { client } from "@/client/client";
import { DataTable } from "@/components/ui/DataTable";
import { useAuth } from "@clerk/nextjs";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { formatRelative } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

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
                package: `@differential-client/${params.clusterId}@${version.version}`,
                package_install: `npm install @differential-client/${params.clusterId}@${version.version}`,
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
                header: "Copy Package Install",
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
                    {/* Clipboard icon svg */}
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5 4a2 2 0 012-2h6a2 2 0 012 2v2h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h2V4zm2 2v2h6V6H7zm0 4v2h6v-2H7zm0 4v2h6v-2H7zm8-8h-2v2h2V6zm0 4h-2v2h2v-2zm0 4h-2v2h2v-2z"
                        fill="currentColor"
                      />
                    </svg>
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
