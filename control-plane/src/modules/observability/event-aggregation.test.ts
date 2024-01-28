import * as jobs from "../jobs";
import { createOwner } from "../test/util";
import * as eventAggregation from "./event-aggregation";
import * as events from "./events";

describe("event-aggregation", () => {
  const clusterId = Math.random().toString();
  const service = Math.random().toString();

  const simulateActivity = async () => {
    await createOwner(clusterId);

    const mockJobs = [
      {
        targetFn: "fn1",
        targetArgs: "args",
        resultType: "resolution",
        result: "woof",
      },
      {
        targetFn: "fn1",
        targetArgs: "args",
        resultType: "resolution",
        result: "woof",
      },
      {
        targetFn: "fn1",
        targetArgs: "args",
        resultType: "rejection",
        result: "meow",
      },
      {
        targetFn: "fn2",
        targetArgs: "args",
        resultType: "resolution",
        result: "woof",
      },
      {
        targetFn: "fn2",
        targetArgs: "args",
        resultType: "rejection",
        result: "woof",
      },
      {
        targetFn: "fn2",
        targetArgs: "args",
        resultType: "rejection",
        result: "meow",
      },
    ] as const;

    const jobIds = await Promise.all(
      mockJobs.map(async ({ targetFn, targetArgs, result, resultType }, i) => {
        const job = await jobs.createJob({
          owner: {
            clusterId,
          },
          service,
          targetFn,
          targetArgs,
        });

        const nextJobsResult = await jobs.nextJobs({
          owner: {
            clusterId,
          },
          service,
          limit: 10,
          machineId: "machine1",
          ip: "1.1.1.1",
        });

        const jobResult = await jobs.persistJobResult({
          jobId: job.id,
          machineId: "machine1",
          resultType,
          result,
          functionExecutionTime: 100 * i,
          owner: {
            clusterId,
          },
        });

        return job.id;
      }),
    );

    return { jobIds };
  };

  beforeAll(async () => {
    events.initialize();
  });

  it("should return the correct metrics", async () => {
    const { jobIds } = await simulateActivity();

    await events.buffer?.flush();

    const metrics = await eventAggregation.getFunctionMetrics({
      clusterId,
      service,
    });

    for (const jobId of jobIds) {
      const activity = await eventAggregation.getJobActivityByJobId({
        clusterId,
        jobId,
      });

      expect(activity).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "jobCreated",
            meta: expect.objectContaining({}),
          }),
          expect.objectContaining({
            type: "jobReceived",
            meta: expect.objectContaining({}),
          }),
          expect.objectContaining({
            type: "jobResulted",
            meta: expect.objectContaining({
              result: expect.stringContaining(""),
              resultType: expect.stringContaining(""),
            }),
          }),
        ]),
      );
    }

    expect(metrics.summary).toStrictEqual([
      {
        avgExecutionTime: 200,
        count: 1,
        maxExecutionTime: 200,
        minExecutionTime: 200,
        resultType: "rejection",
        targetFn: "fn1",
      },
      {
        avgExecutionTime: 50,
        count: 2,
        maxExecutionTime: 100,
        minExecutionTime: 0,
        resultType: "resolution",
        targetFn: "fn1",
      },
      {
        avgExecutionTime: 450,
        count: 2,
        maxExecutionTime: 500,
        minExecutionTime: 400,
        resultType: "rejection",
        targetFn: "fn2",
      },
      {
        avgExecutionTime: 300,
        count: 1,
        maxExecutionTime: 300,
        minExecutionTime: 300,
        resultType: "resolution",
        targetFn: "fn2",
      },
    ]);

    expect(metrics.timeseries).toEqual([
      {
        avgExecutionTime: 250,
        rejectionCount: 3,
        serviceName: service,
        timeBin: expect.stringContaining(new Date().toISOString().slice(0, 4)),
        totalJobResulted: 6,
        totalJobStalled: 0,
      },
    ]);
  }, 10000);
});
