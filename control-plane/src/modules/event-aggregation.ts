import { flux } from "@influxdata/influxdb-client";
import { INFLUXDB_BUCKET, queryClient } from "./influx";

type TimeRange = {
  start: Date;
  stop: Date;
};

type JobComposite = {
  clusterId: string;
  serviceName?: string;
  functionName?: string;
};

// Build a flux query to get the average execution time for a given function over a given time range
export const resultExecutionTimeQuery = (
  target: JobComposite,
  range: TimeRange
) => {
  let query = flux`from(bucket: "${INFLUXDB_BUCKET}")
  |> range(start: ${range.start}, stop: ${range.stop})
  |> filter(fn: (r) => r["_measurement"] == "jobResulted")
  |> filter(fn: (r) => r["clusterId"] == "${target.clusterId}")
  |> filter(fn: (r) => r["resultType"] == "resolution" or r["resultType"] == "rejection")
  |> filter(fn: (r) => r["_field"] == "functionExecutionTime")
`.toString();

  if (target.serviceName) {
    query += flux`|> filter(fn: (r) => r["service"] == "${target.serviceName}")
`.toString();
  }

  if (target.functionName) {
    query +=
      flux`|> filter(fn: (r) => r["function"] == "${target.functionName}")
`.toString();
  }

  query += flux`|> aggregateWindow(every: 1m, fn: mean, createEmpty: true)
`.toString();

  return query;
};

// Build a flux query to get the total number of calls for a given function over a given time range
export const resultCountQuery = (target: JobComposite, range: TimeRange) => {
  let query = flux`from(bucket: "${INFLUXDB_BUCKET}")
  |> range(start: ${range.start}, stop: ${range.stop})
  |> filter(fn: (r) => r["_measurement"] == "jobResulted")
  |> filter(fn: (r) => r["clusterId"] == "${target.clusterId}")
  |> filter(fn: (r) => r["resultType"] == "resolution" or r["resultType"] == "rejection")
  |> filter(fn: (r) => r["_field"] == "functionExecutionTime")
`.toString();

  if (target.serviceName) {
    query += flux`|> filter(fn: (r) => r["service"] == "${target.serviceName}")
`.toString();
  }

  if (target.functionName) {
    query +=
      flux`|> filter(fn: (r) => r["function"] == "${target.functionName}")
`.toString();
  }

  query += `|> aggregateWindow(every: 1m, fn: count, createEmpty: true)
`.toString();

  return query;
};

type Point = { timestamp: Date; value: number };
export const getFunctionMetrics = async (query: {
  clusterId: string;
  serviceName?: string;
  functionName?: string;
  start: Date;
  stop: Date;
}): Promise<{
  success: {
    count: Array<Point>;
    avgExecutionTime: Array<Point>;
  };
  failure: {
    count: Array<Point>;
    avgExecutionTime: Array<Point>;
  };
}> => {
  // Temporarily throw an error if the client is not initialized / enabled
  // QueryClient can be non-optinal once the influxdb flag is removed
  if (!queryClient) {
    throw new Error(
      "InfluxDB client not initialized. Metrics are not available."
    );
  }

  const { clusterId, serviceName, functionName, start, stop } = query;

  // TODO: See if these can be typed better
  const executionCount = await queryClient.collectRows(
    resultCountQuery(
      {
        clusterId,
        serviceName,
        functionName,
      },
      {
        start,
        stop,
      }
    )
  );
  const executionTime = await queryClient.collectRows(
    resultExecutionTimeQuery(
      {
        clusterId,
        serviceName,
        functionName,
      },
      {
        start,
        stop,
      }
    )
  );

  let metrics = {
    success: {
      count: [] as Point[],
      avgExecutionTime: [] as Point[],
    },
    failure: {
      count: [] as Point[],
      avgExecutionTime: [] as Point[],
    },
  };

  // Build metrics object based on results by resultType
  const processResults = (
    result: any,
    property: "count" | "avgExecutionTime"
  ): void => {
    if (result["resultType"] === "resolution") {
      metrics.success[property].push({
        timestamp: result["_time"],
        value: Math.round(result._value),
      });
    } else if (result.resultType === "rejection") {
      metrics.failure[property].push({
        timestamp: result["_time"],
        value: Math.round(result._value),
      });
    }
  };
  executionCount.forEach((x: any) => processResults(x, "count"));
  executionTime.forEach((x: any) => processResults(x, "avgExecutionTime"));

  return metrics;
};

export const getJobActivityByJobId = async (params: {
  clusterId: string;
  jobId: string;
}) => {
  let query = flux`from(bucket: "${INFLUXDB_BUCKET}")
  |> range(start: -7d)
  |> filter(fn: (r) => r["_measurement"] == "jobActivity")
  |> filter(fn: (r) => r["_field"] == "meta")
  |> filter(fn: (r) => r["clusterId"] == "${params.clusterId}")
  |> filter(fn: (r) => r["jobId"] == "${params.jobId}")
`.toString();

  type JobActivity = {
    _field: string;
    _measurement: string;
    _start: string;
    _stop: string;
    _time: string;
    _value: string;
    clusterId: string; // or number, depending on the actual type
    jobId: string; // or number, depending on the actual type
    result: string;
    service?: string;
    machineId?: string;
    table: number;
    type: string;
  };

  const result: JobActivity[] = (await queryClient?.collectRows(query)) ?? [];

  return result.map((point) => ({
    timestamp: point._time,
    type: point.type,
    service: point.service,
    meta: point._value,
    clusterId: point.clusterId,
    jobId: point.jobId,
    machineId: point.machineId,
  }));
};
