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
        variant={currentPath.includes("overview") ? "outline" : "secondary"}
      >
        <Link href={`/clusters/${clusterId}/overview`}>Overview</Link>
      </Button>
      <Button
        asChild
        variant={currentPath.includes("services") ? "outline" : "secondary"}
      >
        <Link href={`/clusters/${clusterId}/services`}>Services</Link>
      </Button>
      <Button
        asChild
        variant={currentPath.includes("monitoring") ? "outline" : "secondary"}
      >
        <Link href={`/clusters/${clusterId}/monitoring`}>Monitoring</Link>
      </Button>
      {/* <Button
        asChild
        variant={currentPath.includes("advanced") ? "outline" : "secondary"}
      >
        <Link href={`/clusters/${clusterId}/advanced`}>Advanced Settings</Link>
      </Button> */}
      <Button
        asChild
        variant={
          currentPath.includes("client-libraries") ? "outline" : "secondary"
        }
      >
        <Link href={`/clusters/${clusterId}/client-libraries`}>
          Client Libraries
        </Link>
      </Button>
      <Button
        asChild
        variant={currentPath.includes("tasks") ? "outline" : "secondary"}
      >
        <Link href={`/clusters/${clusterId}/tasks`}>Tasks</Link>
      </Button>
    </div>
  );
}
