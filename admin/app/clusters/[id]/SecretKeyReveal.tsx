"use client";

import { Button } from "flowbite-react";
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
        <Button size="sm" onClick={() => setRevealed(!revealed)} color="blue">
          {revealed ? "Hide" : "Reveal"}
        </Button>
        {/* Revoke */}
        <Button
          size="sm"
          color="red"
          onClick={() => {
            toast.error(
              "Revoking is not supported yet through the UI. Please use the CLI."
            );
          }}
        >
          Revoke
        </Button>
      </div>
    </div>
  );
};
