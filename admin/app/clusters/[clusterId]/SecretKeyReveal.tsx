"use client";

import { Button } from "@/components/ui/button";
import { clipboardSvg } from "@/components/ui/clipboard-button";
import { useState } from "react";
import { toast } from "react-hot-toast";

const padRightWithAsterisks = (str: string) => {
  const asterisksForPadding = str.length - 8;

  return `${str.slice(0, 8)}${"*".repeat(asterisksForPadding)}`;
};

export const SecretKeyReveal = ({ secretKey }: { secretKey: string }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <p className="font-mono my-4">
        {revealed ? secretKey : padRightWithAsterisks(secretKey)}
      </p>
      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(secretKey);
            toast.success("Copied to clipboard");
          }}
          color="blue"
        >
          {clipboardSvg()}
        </Button>
        <Button size="sm" onClick={() => setRevealed(!revealed)} color="blue">
          {revealed ? "Hide" : "Reveal"}
        </Button>
        {/* Revoke */}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            toast.error(
              "Revoking is not supported yet through the UI. Please use the CLI.",
            );
          }}
        >
          Revoke
        </Button>
      </div>
    </div>
  );
};
