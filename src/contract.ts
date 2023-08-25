import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

const NextJobSchema = z.object({
  id: z.string(),
  targetFn: z.string(),
  targetArgs: z.string(),
});

export const contract = c.router({
  ackMachine: {
    method: "PUT",
    path: "/environments/:environmentId/machines/:machineId",
    pathParams: z.object({
      environmentId: z.string(),
      machineId: z.string(),
    }),
    responses: {
      204: z.undefined(),
    },
    body: z.object({
      description: z.string().nullable(),
      class: z.string().nullable(),
    }),
  },
  getNextJobs: {
    method: "GET",
    path: "/environments/:environmentId/next-job",
    headers: z.object({
      authorization: z.string(),
    }),
    pathParams: z.object({
      environmentId: z.string(),
    }),
    query: z.object({
      limit: z.coerce.number().default(1),
    }),
    responses: {
      200: z.array(NextJobSchema),
      204: z.undefined(),
    },
  },
  createJob: {
    method: "POST",
    path: "/environments/:environmentId/jobs",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      201: z.object({
        id: z.string(),
      }),
      401: z.undefined(),
    },
    body: z.object({
      targetFn: z.string(),
      targetArgs: z.string(),
    }),
  },
  getJobStatus: {
    method: "GET",
    path: "/jobs/:jobId",
    pathParams: z.object({
      jobId: z.string(),
    }),
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      200: z.object({
        status: z.enum(["pending", "running", "success", "failure"]),
        result: z.string().nullable(),
        resultType: z.enum(["resolution", "rejection"]).nullable(),
      }),
      404: z.undefined(),
      401: z.undefined(),
    },
  },
  persistJobResult: {
    method: "POST",
    path: "/environments/:environmentId/jobs/:jobId/result",
    headers: z.object({
      authorization: z.string(),
    }),
    pathParams: z.object({
      environmentId: z.string(),
      jobId: z.string(),
    }),
    responses: {
      204: z.undefined(),
      401: z.undefined(),
    },
    body: z.object({
      result: z.string(),
      resultType: z.enum(["resolution", "rejection"]),
    }),
  },
  live: {
    method: "GET",
    path: "/live",
    responses: {
      200: z.object({
        status: z.string(),
      }),
    },
  },
  getContract: {
    method: "GET",
    path: "/contract",
    responses: {
      200: z.object({
        contract: z.string(),
      }),
    },
  },
});

