import { initClient } from "@ts-rest/core";
import { contract } from "./contract";

export const client = initClient(contract, {
  baseUrl:
    process.env.NEXT_PUBLIC_DIFFERENTIAL_API_URL ||
    "https://api.differential.dev",
  baseHeaders: {},
});
