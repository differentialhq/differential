import { initClient } from "@ts-rest/core";
import { contract } from "./contract";

if (!process.env.PREDICTOR_API_URL) {
  console.warn("PREDICTOR_API_URL is not set");
}

export const client = process.env.PREDICTOR_API_URL
  ? initClient(contract, {
      baseUrl: process.env.PREDICTOR_API_URL,
      baseHeaders: {},
    })
  : null;
