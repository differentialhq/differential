import { flux } from "@influxdata/influxdb-client";
import { INFLUXDB_BUCKET, queryClient } from "./influx";

type TimeRange = {
  start: Date;
  stop: Date;
};

type JobComposite = {
  clusterId: string;
  serviceName: string;
  functionName: string;
};

// Build a flux query to get the average execution time for a given function over a given time range
export const resultExecutionTimeQuery = (
  target: JobComposite,
  range: TimeRange
) => flux`from(bucket: "${INFLUXDB_BUCKET}")
  |> range(start: ${range.start}, stop: ${range.stop})
  |> filter(fn: (r) => r["_measurement"] == "jobResulted")
  |> filter(fn: (r) => r["clusterId"] == "${target.clusterId}")
  |> filter(fn: (r) => r["service"] == "${target.serviceName}")
  |> filter(fn: (r) => r["function"] == "${target.functionName}")
  |> filter(fn: (r) => r["resultType"] == "resolution" or r["resultType"] == "rejection")
  |> filter(fn: (r) => r["_field"] == "functionExecutionTime")
  |> mean()
`;

// Build a flux query to get the total number of calls for a given function over a given time range
export const resultCountQuery = (
  target: JobComposite,
  range: TimeRange
) => flux`from(bucket: "${INFLUXDB_BUCKET}")
  |> range(start: ${range.start}, stop: ${range.stop})
  |> filter(fn: (r) => r["_measurement"] == "jobResulted")
  |> filter(fn: (r) => r["clusterId"] == "${target.clusterId}")
  |> filter(fn: (r) => r["service"] == "${target.serviceName}")
  |> filter(fn: (r) => r["function"] == "${target.functionName}")
  |> filter(fn: (r) => r["resultType"] == "resolution" or r["resultType"] == "rejection")
  |> filter(fn: (r) => r["_field"] == "functionExecutionTime")
  |> count()
`;

export const getFunctionMetrics = async (
  clusterId: string,
  serviceName: string,
  functionName: string,
  start: Date,
  stop: Date
): Promise<{
  success: {
    count: number;
    avgExecutionTime: number;
  };
  failure: {
    count: number;
    avgExecutionTime: number;
  };
}> => {
  // Temporarily throw an error if the client is not initialized / enabled
  // QueryClient can be non-optinal once the influxdb flag is removed
  if (!queryClient) {
    throw new Error(
      "InfluxDB client not initialized. Metrics are not available."
    );
  }

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
      count: 0,
      avgExecutionTime: 0,
    },
    failure: {
      count: 0,
      avgExecutionTime: 0,
    },
  };

  // Build metrics object based on results by resultType
  const processResults = (
    result: any,
    property: "count" | "avgExecutionTime"
  ): void => {
    if (result["resultType"] === "resolution") {
      metrics.success[property] = Math.round(result._value);
    } else if (result.resultType === "rejection") {
      metrics.failure[property] = Math.round(result._value);
    }
  };
  executionCount.forEach((x: any) => processResults(x, "count"));
  executionTime.forEach((x: any) => processResults(x, "avgExecutionTime"));

  return metrics;
};
