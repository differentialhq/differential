import * as metrics from "./event-aggregation";
import { writeEvent } from "./events";
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

    const result = await metrics.getFunctionMetrics(
      clusterId,
      serviceName,
      functionName,
      start,
      stop
    );

    expect(result).toEqual({
      success: {
        count: 0,
        avgExecutionTime: 0,
      },
      failure: {
        count: 0,
        avgExecutionTime: 0,
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
      result = await metrics.getFunctionMetrics(
        clusterId,
        serviceName,
        functionName,
        start,
        stop
      );

      if (result.success.count !== 2 || result.failure.count !== 2) {
        console.log(`Waiting for metrics to be aggregated...`, result);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } while (result.success.count !== 2 || result.failure.count !== 2);

    expect(result).toEqual({
      success: {
        count: 2,
        avgExecutionTime: 150,
      },
      failure: {
        count: 2,
        avgExecutionTime: 350,
      },
    });
  }, 20000);
});
