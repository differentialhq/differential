import * as metrics from "./event-aggregation";
import { writeEvent, writeJobActivity } from "./events";
import * as influx from "./influx";

const serviceName = `event-aggregation-test`;

describe("getFunctionMetrics", () => {
  it("client must be defined", () => {
    expect(influx.queryClient).toBeDefined();
    expect(influx.writeClient).toBeDefined();
  });

  it("returns empty metrics response when no rows are returned", async () => {
    const clusterId = Math.random().toString();
    const functionName = "fn";
    const start = new Date(Date.now() - 86400000);
    const stop = new Date();

    const result = await metrics.getFunctionMetrics({
      clusterId,
      serviceName,
      start,
      stop,
      functionName,
    });

    expect(result).toEqual({
      success: {
        count: [],
        avgExecutionTime: [],
      },
      failure: {
        count: [],
        avgExecutionTime: [],
      },
    });
  });

  it("correctly build success and failure metrics object", async () => {
    const clusterId = Math.random().toString();
    const functionName = "fn";

    const start = new Date(Date.now() - 1000);

    // For some reason, influxdb doesn't like it when we write events too fast
    // TODO: investigate why
    const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

    writeEvent({
      type: "jobResulted",
      tags: {
        clusterId,
        service: serviceName,
        function: functionName,
        resultType: "resolution",
      },
      intFields: {
        functionExecutionTime: 100,
      },
      stringFields: {
        jobId: Math.random().toString(),
      },
    });

    await nextTick();

    writeEvent({
      type: "jobResulted",
      tags: {
        clusterId,
        service: serviceName,
        function: functionName,
        resultType: "resolution",
      },
      intFields: {
        functionExecutionTime: 200,
      },
      stringFields: {
        jobId: Math.random().toString(),
      },
    });

    await nextTick();

    writeEvent({
      type: "jobResulted",
      tags: {
        clusterId,
        service: serviceName,
        function: functionName,
        resultType: "rejection",
      },
      intFields: {
        functionExecutionTime: 300,
      },
      stringFields: {
        jobId: Math.random().toString(),
      },
    });

    await nextTick();

    writeEvent({
      type: "jobResulted",
      tags: {
        clusterId,
        service: serviceName,
        function: functionName,
        resultType: "rejection",
      },
      intFields: {
        functionExecutionTime: 400,
      },
      stringFields: {
        jobId: Math.random().toString(),
      },
    });

    // wait 2s for the events to be written
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await influx.writeClient?.flush(true);

    const stop = new Date(Date.now() + 1000);

    let result;

    do {
      result = await metrics.getFunctionMetrics({
        clusterId,
        serviceName,
        start,
        stop,
        functionName,
      });

      if (
        result.success.count.length !== 1 ||
        result.failure.count.length !== 1
      ) {
        console.log(`Waiting for metrics to be aggregated...`, result);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } while (
      result.success.count.length !== 1 ||
      result.failure.count.length !== 1
    );

    expect(result).toEqual({
      success: {
        count: [{ timestamp: expect.anything(), value: 2 }],
        avgExecutionTime: [{ timestamp: expect.anything(), value: 150 }],
      },
      failure: {
        count: [{ timestamp: expect.anything(), value: 2 }],
        avgExecutionTime: [{ timestamp: expect.anything(), value: 350 }],
      },
    });
  }, 20000);

  it("records and returns job activity", async () => {
    const service = "service";
    const clusterId = Math.random().toString();
    const jobId = Math.random().toString();

    const targetFn = "fn";
    const targetArgs = JSON.stringify({ foo: "bar" });

    writeJobActivity({
      service,
      clusterId,
      jobId,
      type: "RECEIVED_BY_CONTROL_PLANE",
      meta: {
        targetFn,
        targetArgs,
      },
    });

    writeJobActivity({
      service,
      clusterId,
      jobId,
      type: "RESULT_SENT_TO_CONTROL_PLANE",
      machineId: "machineId",
      meta: {
        targetFn,
        resultType: "resolution",
        result: "baz",
      },
    });

    // wait 2s for the events to be written
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await influx.writeClient?.flush(true);

    const retrieved = await metrics.getJobActivityByJobId({
      clusterId,
      jobId,
      interval: "7d",
    });

    expect(retrieved).toEqual([
      {
        timestamp: expect.any(String),
        type: "RECEIVED_BY_CONTROL_PLANE",
        service,
        meta: JSON.stringify({ targetFn, targetArgs }),
        jobId,
        machineId: null,
      },
      {
        timestamp: expect.any(String),
        type: "RESULT_SENT_TO_CONTROL_PLANE",
        service,
        meta: JSON.stringify({
          targetFn,
          resultType: "resolution",
          result: "baz",
        }),
        jobId,
        machineId: "machineId",
      },
    ]);
  }, 10000);
});
