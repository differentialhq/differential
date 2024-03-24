import { initClient } from "@ts-rest/core";
import { contract } from "./contract";
import { env } from "../../utilities/env";
import { logger } from "../../utilities/logger";

if (!env.PREDICTOR_API_URL) {
  logger.warn("PREDICTOR_API_URL is not set");
}

export const client = env.PREDICTOR_API_URL
  ? initClient(contract, {
      baseUrl: env.PREDICTOR_API_URL,
      baseHeaders: {},
    })
  : null;
