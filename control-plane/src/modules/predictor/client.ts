import { initClient } from "@ts-rest/core";
import { contract } from "./contract";
import { env } from "../../utilities/env";

if (!env.PREDICTOR_API_URL) {
  console.warn("PREDICTOR_API_URL is not set");
}

export const client = env.PREDICTOR_API_URL
  ? initClient(contract, {
      baseUrl: env.PREDICTOR_API_URL,
      baseHeaders: {},
    })
  : null;
