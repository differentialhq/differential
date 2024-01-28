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

    const fn1Metrics = await eventAggregation.getFunctionMetrics({
      clusterId,
      service,
      targetFn: "fn1",
    });

    const fn2Metrics = await eventAggregation.getFunctionMetrics({
      clusterId,
      service,
      targetFn: "fn2",
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

    expect(fn1Metrics).toStrictEqual({
      failure: {
        count: 1,
        avgExecutionTime: 200,
        minExecutionTime: 200,
        maxExecutionTime: 200,
      },
      success: {
        count: 2,
        avgExecutionTime: 50,
        minExecutionTime: 0,
        maxExecutionTime: 100,
      },
    });

    expect(fn2Metrics).toStrictEqual({
      failure: {
        count: 2,
        avgExecutionTime: 450,
        minExecutionTime: 400,
        maxExecutionTime: 500,
      },
      success: {
        count: 1,
        avgExecutionTime: 300,
        minExecutionTime: 300,
        maxExecutionTime: 300,
      },
    });
  }, 10000);
});
