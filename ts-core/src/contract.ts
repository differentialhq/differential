import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

const NextJobSchema = z.object({
  id: z.string(),
  targetFn: z.string(),
  targetArgs: z.string(),
});

export const contract = c.router({
  getNextJobs: {
    method: "GET",
    path: "/jobs",
    headers: z.object({
      authorization: z.string(),
      "x-machine-id": z.string(),
    }),
    query: z.object({
      limit: z.coerce.number().default(1),
      service: z.string().optional(),
      ttl: z.coerce.number().min(5000).max(20000).default(20000),
    }),
    responses: {
      200: z.array(NextJobSchema),
      204: z.undefined(),
    },
  },
  createJob: {
    method: "POST",
    path: "/jobs",
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
      pool: z.string().optional(),
      service: z.string().optional(),
    }),
  },
  getJobStatus: {
    method: "GET",
    path: "/jobs/:jobId",
    pathParams: z.object({
      jobId: z.string(),
    }),
    query: z.object({
      ttl: z.coerce.number().min(5000).max(20000).default(20000),
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
    path: "/jobs/:jobId/result",
    headers: z.object({
      authorization: z.string(),
    }),
    pathParams: z.object({
      jobId: z.string(),
    }),
    responses: {
      204: z.undefined(),
      401: z.undefined(),
    },
    body: z.object({
      result: z.string(),
      resultType: z.enum(["resolution", "rejection"]),
      functionExecutionTime: z.number().optional(),
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
  createCredential: {
    method: "POST",
    path: "/organizations/:organizationId/clusters",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      201: z.object({
        apiSecret: z.string(),
      }),
      401: z.undefined(),
    },
    pathParams: z.object({
      organizationId: z.string(),
    }),
    body: z.object({}),
  },
  getTemporaryToken: {
    method: "GET",
    path: "/demo/token",
    responses: {
      201: z.string(),
    },
  },
  // management routes
  getClustersForUser: {
    method: "GET",
    path: "/clusters",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      200: z.array(
        z.object({
          id: z.string(),
          apiSecret: z.string(),
          createdAt: z.date(),
          description: z.string().nullable(),
        })
      ),
      401: z.undefined(),
    },
  },
  createClusterForUser: {
    method: "POST",
    path: "/clusters",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      204: z.undefined(),
    },
    body: z.object({
      description: z.string(),
    }),
  },
  getClusterDetailsForUser: {
    method: "GET",
    path: "/clusters/:clusterId",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      200: z.object({
        id: z.string(),
        apiSecret: z.string(),
        createdAt: z.date(),
        machines: z.array(
          z.object({
            id: z.string(),
            description: z.string().nullable(),
            pool: z.string().nullable(),
            lastPingAt: z.date().nullable(),
            ip: z.string().nullable(),
          })
        ),
        jobs: z.array(
          z.object({
            id: z.string(),
            targetFn: z.string(),
            status: z.string(),
            createdAt: z.date(),
            functionExecutionTime: z.number().nullable(),
          })
        ),
      }),
      401: z.undefined(),
      404: z.undefined(),
    },
    pathParams: z.object({
      clusterId: z.string(),
    }),
  },
});

