import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const contract = c.router({
  predictRetryability: {
    method: "POST",
    path: "/is-retryable",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.object({
      errorName: z.string(),
      errorMessage: z.string(),
    }),
    responses: {
      200: z.object({
        retryable: z.boolean(),
      }),
    },
  },
  patchFunction: {
    method: "POST",
    path: "/patch-function",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.object({
      errorName: z.string(),
      errorMessage: z.string(),
      fn: z.string(),
    }),
    responses: {
      200: z.object({
        patch: z.string().nullable(),
      }),
    },
  },
  live: {
    method: "GET",
    path: "/live",
    responses: {
      200: z.object({
        live: z.boolean(),
      }),
    },
  },
});
