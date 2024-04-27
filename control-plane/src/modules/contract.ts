import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

const NextJobSchema = z.object({
  id: z.string(),
  targetFn: z.string(),
  targetArgs: z.string(),
});

export const definition = {
  createJobsRequest: {
    method: "POST",
    path: "/jobs-request",
    headers: z.object({
      authorization: z.string(),
      "x-machine-id": z.string(),
      "x-deployment-id": z.string().optional(),
    }),
    body: z.object({
      limit: z.coerce.number().default(1),
      service: z.string(),
      ttl: z.coerce.number().min(5000).max(20000).default(20000),
      functions: z
        .array(
          z.object({
            name: z.string(),
          }),
        )
        .optional(),
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
      service: z.string(),
      callConfig: z
        .object({
          cache: z
            .object({
              key: z.string(),
              ttlSeconds: z.number(),
            })
            .optional(),
          retryCountOnStall: z.number(),
          predictiveRetriesOnRejection: z.boolean(),
          timeoutSeconds: z.number(),
          executionId: z.string().optional(),
          background: z.boolean().default(false),
        })
        .optional(),
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
        status: z.enum(["pending", "running", "success", "failure", "stalled"]),
        result: z.string().nullable(),
        resultType: z.enum(["resolution", "rejection"]).nullable(),
      }),
      404: z.undefined(),
      401: z.undefined(),
    },
  },
  getJobStatuses: {
    method: "POST",
    path: "/batch-jobs-status-request",
    body: z.object({
      jobIds: z.array(z.string()).max(1000),
      ttl: z.coerce.number().min(5000).max(20000).default(20000),
    }),
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      200: z.array(
        z.object({
          id: z.string(),
          status: z.enum([
            "pending",
            "running",
            "success",
            "failure",
            "stalled",
          ]),
          result: z.string().nullable(),
          resultType: z.enum(["resolution", "rejection"]).nullable(),
        }),
      ),
      401: z.undefined(),
    },
  },
  persistJobResult: {
    method: "POST",
    path: "/jobs/:jobId/result",
    headers: z.object({
      authorization: z.string(),
      "x-machine-id": z.string(),
      "x-deployment-id": z.string().optional(),
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
        }),
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
            lastPingAt: z.date().nullable(),
            ip: z.string().nullable(),
            deploymentId: z.string().nullable(),
          }),
        ),
        jobs: z.array(
          z.object({
            id: z.string(),
            targetFn: z.string(),
            service: z.string().nullable(),
            status: z.string(),
            resultType: z.string().nullable(),
            createdAt: z.date(),
            functionExecutionTime: z.number().nullable(),
          }),
        ),
        definitions: z.array(
          z.object({
            name: z.string(),
            functions: z
              .array(
                z.object({
                  name: z.string(),
                  rate: z
                    .object({
                      per: z.enum(["minute", "hour"]),
                      limit: z.number(),
                    })
                    .optional(),
                  cacheTTL: z.number().optional(),
                }),
              )
              .optional(),
          }),
        ),
        deployments: z.array(
          z.object({
            id: z.string(),
          }),
        ),
      }),
      401: z.undefined(),
      404: z.undefined(),
    },
    pathParams: z.object({
      clusterId: z.string(),
    }),
  },
  getClusterServiceDetailsForUser: {
    method: "GET",
    path: "/clusters/:clusterId/service/:serviceName",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      200: z.object({
        jobs: z.array(
          z.object({
            id: z.string(),
            targetFn: z.string(),
            service: z.string().nullable(),
            status: z.string(),
            resultType: z.string().nullable(),
            createdAt: z.date(),
            functionExecutionTime: z.number().nullable(),
          }),
        ),
        definition: z
          .object({
            name: z.string(),
            functions: z
              .array(
                z.object({
                  name: z.string(),
                  rate: z
                    .object({
                      per: z.enum(["minute", "hour"]),
                      limit: z.number(),
                    })
                    .optional(),
                  cacheTTL: z.number().optional(),
                }),
              )
              .optional(),
          })
          .nullable(),
      }),
      401: z.undefined(),
      404: z.undefined(),
    },
    pathParams: z.object({
      clusterId: z.string(),
      serviceName: z.string(),
    }),
    query: z.object({
      limit: z.coerce.number().min(100).max(5000).default(2000),
    }),
  },
  getMetrics: {
    method: "GET",
    path: "/clusters/:clusterId/metrics",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      200: z.object({
        summary: z.array(
          z.object({
            targetFn: z.string(),
            resultType: z.string(),
            count: z.number(),
            avgExecutionTime: z.number(),
            minExecutionTime: z.number(),
            maxExecutionTime: z.number(),
          }),
        ),
        timeseries: z.array(
          z.object({
            timeBin: z.string(),
            serviceName: z.string(),
            avgExecutionTime: z.number(),
            totalJobResulted: z.number(),
            totalJobStalled: z.number(),
            rejectionCount: z.number(),
          }),
        ),
      }),
      401: z.undefined(),
      404: z.undefined(),
    },
    pathParams: z.object({
      clusterId: z.string(),
    }),
    query: z.object({
      serviceName: z.string(),
    }),
  },
  ingestClientEvents: {
    method: "POST",
    path: "/metrics",
    headers: z.object({
      authorization: z.string(),
      "x-machine-id": z.string(),
      "x-deployment-id": z.string().optional(),
    }),
    responses: {
      204: z.undefined(),
      401: z.undefined(),
    },
    body: z.object({
      events: z.array(
        z.object({
          timestamp: z.coerce.date(),
          type: z.enum(["machineResourceProbe", "functionInvocation"]),
          tags: z.record(z.string()).optional(),
          intFields: z.record(z.number()).optional(),
        }),
      ),
    }),
  },
  getActivity: {
    method: "GET",
    path: "/clusters/:clusterId/activity",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      200: z.array(
        z.object({
          type: z.string(),
          meta: z.unknown(),
          machineId: z.string().nullable(),
          deploymentId: z.string().nullable(),
          timestamp: z.date(),
          service: z.string().nullable(),
        }),
      ),
      401: z.undefined(),
      404: z.undefined(),
    },
    query: z.object({
      jobId: z.string().optional(),
      deploymentId: z.string().optional(),
    }),
  },
  createDeployment: {
    method: "POST",
    path: "/clusters/:clusterId/service/:serviceName/deployments",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.undefined(),
    responses: {
      501: z.undefined(),
      401: z.undefined(),
      201: z.object({
        id: z.string(),
        status: z.string(),
        clusterId: z.string(),
        service: z.string(),
        provider: z.string(),
        createdAt: z.date(),
      }),
    },
  },
  getDeployment: {
    method: "GET",
    path: "/clusters/:clusterId/service/:serviceName/deployments/:deploymentId",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.undefined(),
    responses: {
      401: z.undefined(),
      404: z.undefined(),
      200: z.object({
        id: z.string(),
        status: z.enum(["uploading", "active", "inactive", "failed"]),
        clusterId: z.string(),
        service: z.string(),
        provider: z.string(),
        createdAt: z.date(),
      }),
    },
  },
  getDeployments: {
    method: "GET",
    path: "/clusters/:clusterId/service/:serviceName/deployments",
    headers: z.object({
      authorization: z.string(),
    }),
    query: z.object({
      status: z.enum(["uploading", "active", "inactive", "failed"]).optional(),
      limit: z.coerce.number().min(1).max(100).default(10),
    }),
    responses: {
      200: z.array(
        z.object({
          id: z.string(),
          status: z.enum(["uploading", "active", "inactive", "failed"]),
          clusterId: z.string(),
          service: z.string(),
          provider: z.string(),
          createdAt: z.date(),
        }),
      ),
      401: z.undefined(),
    },
  },
  releaseDeployment: {
    method: "POST",
    path: "/clusters/:clusterId/service/:serviceName/deployments/:deploymentId/release",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.undefined(),
    responses: {
      400: z.undefined(),
      401: z.undefined(),
      404: z.undefined(),
      200: z.object({
        id: z.string(),
        status: z.string(),
        clusterId: z.string(),
        service: z.string(),
        provider: z.string(),
        createdAt: z.date(),
      }),
    },
  },
  getDeploymentLogs: {
    method: "GET",
    path: "/clusters/:clusterId/service/:serviceName/deployments/:deploymentId/logs",
    headers: z.object({
      authorization: z.string(),
    }),
    query: z.object({
      next: z.string().optional(),
      filter: z.string().optional(),
      start: z.coerce.date().optional(),
      end: z.coerce.date().optional(),
    }),
    body: z.undefined(),
    responses: {
      401: z.undefined(),
      404: z.undefined(),
      200: z.object({
        events: z.array(
          z.object({
            message: z.string(),
          }),
        ),
        next: z.string().optional(),
      }),
    },
  },
  createClientLibraryVersion: {
    method: "POST",
    path: "/clusters/:clusterId/client-libraries",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.object({
      increment: z
        .enum(["patch", "minor", "major"])
        .optional()
        .default("patch"),
    }),
    responses: {
      501: z.undefined(),
      401: z.undefined(),
      201: z.object({
        id: z.string(),
        version: z.string(),
      }),
    },
  },
  getClientLibraryVersions: {
    method: "GET",
    path: "/clusters/:clusterId/client-libraries",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      501: z.undefined(),
      401: z.undefined(),
      200: z.array(
        z.object({
          id: z.string(),
          version: z.string(),
          uploadedAt: z.date(),
        }),
      ),
    },
  },
  createAsset: {
    method: "POST",
    path: "/clusters/:clusterId/assets",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.object({
      type: z.enum(["client_library", "service_bundle"]),
      target: z.string(),
    }),
    responses: {
      201: z.object({
        presignedUrl: z.string(),
      }),
      400: z.undefined(),
      401: z.undefined(),
    },
  },
  setClusterSettings: {
    method: "PUT",
    path: "/clusters/:clusterId/settings",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.object({
      predictiveRetriesEnabled: z.boolean(),
    }),
    responses: {
      204: z.undefined(),
      401: z.undefined(),
    },
    pathParams: z.object({
      clusterId: z.string(),
    }),
  },
  getClusterSettings: {
    method: "GET",
    path: "/clusters/:clusterId/settings",
    headers: z.object({
      authorization: z.string(),
    }),
    responses: {
      200: z.object({
        predictiveRetriesEnabled: z.boolean(),
        cloudEnabled: z.boolean(),
      }),
      401: z.undefined(),
    },
    pathParams: z.object({
      clusterId: z.string(),
    }),
  },
  npmRegistryDefinition: {
    method: "GET",
    path: "/packages/npm/:packageName",
    responses: {
      501: z.undefined(),
      404: z.undefined(),
      200: z.object({
        "dist-tags": z.record(z.string()),
        name: z.string(),
        versions: z.record(
          z.object({
            name: z.string(),
            description: z.string(),
            version: z.string(),
            dist: z.object({
              tarball: z.string(),
            }),
          }),
        ),
      }),
    },
  },
  npmRegistryDownload: {
    method: "GET",
    path: "/packages/npm/:packageName/:version",
    responses: {
      501: z.undefined(),
      404: z.undefined(),
      200: z.any(),
    },
  },
  sns: {
    method: "POST",
    body: z.object({
      Token: z.string().optional(),
      Message: z.string().optional(),
      TopicArn: z.string(),
      Subject: z.string().optional(),
      Type: z.enum(["Notification", "SubscriptionConfirmation"]),
    }),
    path: "/events/sns",
    responses: {
      200: z.undefined(),
      400: z.undefined(),
    },
  },
  createOrUpdateClusterAccessPoint: {
    method: "PUT",
    path: "/clusters/:clusterId/access-point/:name",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.object({
      allowedServices: z.string(),
    }),
    responses: {
      200: z.object({
        token: z.string(),
      }),
      401: z.undefined(),
      404: z.undefined(),
    },
  },
  deleteClusterAccessPoint: {
    method: "DELETE",
    path: "/clusters/:clusterId/access-point/:name",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.undefined(),
    responses: {
      204: z.undefined(),
      401: z.undefined(),
      404: z.undefined(),
    },
  },
  executeJobSync: {
    method: "POST",
    path: "/clusters/:clusterId/execute",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.object({
      service: z.string(),
      function: z.string(),
      args: z.array(z.any()),
    }),
    responses: {
      401: z.undefined(),
      404: z.undefined(),
      200: z.object({
        resultType: z.string(),
        result: z.any(),
        status: z.string(),
      }),
      500: z.object({
        error: z.string(),
      }),
    },
  },
  storeSchema: {
    method: "PUT",
    path: "/clusters/:clusterId/service/:serviceName/schema",
    headers: z.object({
      authorization: z.string(),
    }),
    body: z.object({
      schema: z.string(),
    }),
    responses: {
      204: z.undefined(),
      401: z.undefined(),
    },
  },
} as const;

export const contract = c.router(definition);
