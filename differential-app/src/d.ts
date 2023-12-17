import { Differential } from "@differentialhq/core";

// Go to https://api.differential.dev/demo/token and replace the token below
// with the temporary token you receive.
const apiSecret = "REPLACE_ME";

if (apiSecret === "REPLACE_ME") {
  throw new Error("Please replace the apiSecret with your own");
}

export const d = new Differential(apiSecret);
