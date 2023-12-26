import { initQueryClient } from "@ts-rest/react-query";
import { contract } from "./contract";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET env var is required");
}

export const client = initQueryClient(contract, {
  baseUrl: process.env.DIFFERENTIAL_API_URL || "https://api.differential.dev",
  baseHeaders: {
    Authorization: `Bearer ${jwt.sign(
      {
        sub: "admin",
        iat: Math.floor(Date.now() / 1000),
        // expire in 1 hour
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        aud: "https://api.differential.dev",
      },
      process.env.JWT_SECRET
    )}`,
  },
});
