require("dotenv").config();

import { Differential } from "../../Differential";

const secret = process.env.DIFFERENTIAL_API_SECRET;

if (!secret) {
  throw new Error("Missing env demoToken");
}

export const d = new Differential(secret, {
  endpoint: process.env.DIFFERENTIAL_API_ENDPOINT_OVERRIDE,
  jobPollWaitTime: 5000,
});
