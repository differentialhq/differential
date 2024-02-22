"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation({ clusterId }: { clusterId: string }) {
  const currentPath = usePathname();

  return (
    <div className="flex flex-row mt-4 space-x-2">
      <Button
        asChild
        variant={currentPath.includes("overview") ? "link" : "secondary"}
      >
        <Link href={`/clusters/${clusterId}/overview`}>Overview</Link>
      </Button>
      <Button
        asChild
        variant={currentPath.includes("services") ? "link" : "secondary"}
      >
        <Link href={`/clusters/${clusterId}/services`}>Services</Link>
      </Button>
      <Button
        asChild
        variant={currentPath.includes("monitoring") ? "link" : "secondary"}
      >
        <Link href={`/clusters/${clusterId}/monitoring`}>Monitoring</Link>
      </Button>
      <Button
        asChild
        variant={currentPath.includes("advanced") ? "link" : "secondary"}
      >
        <Link href={`/clusters/${clusterId}/advanced`}>Advanced Settings</Link>
      </Button>
    </div>
  );
}
