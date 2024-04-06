"use client";

import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export const CopyButton = ({ script }: { script: string }) => (
  <Button
    size="sm"
    onClick={() => {
      navigator.clipboard.writeText(script);
      toast.success("Copied to clipboard");
    }}
    color="blue"
  >
    Copy to clipboard
  </Button>
);
