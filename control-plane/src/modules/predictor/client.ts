import { initClient } from "@ts-rest/core";
import { contract } from "./contract";

export const client = process.env.PREDICTOR_API_URL
  ? initClient(contract, {
      baseUrl: process.env.PREDICTOR_API_URL,
      baseHeaders: {},
    })
  : null;
