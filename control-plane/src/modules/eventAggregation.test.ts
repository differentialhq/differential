import * as influx from "./influx";
import * as metrics from "./eventAggregation";
import { ParameterizedQuery } from "@influxdata/influxdb-client";

jest.mock('./influx')
; (influx as any)['queryClient'] = {}

const clusterId = "clusterId";
const serviceName = "serviceName";
const functionName = "functionName";
const start = new Date(Date.now() - 86400000);
const stop = new Date();


describe("getFunctionMetrics", () => {
  it("returns empty metrics response when no rows are returned", async () => {
    influx.queryClient!.collectRows = jest.fn().mockResolvedValue([]);

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
    influx.queryClient!.collectRows = jest.fn().mockImplementation((query: ParameterizedQuery) => {
      if (query.toString().includes("count()")) {
        return [
          {
            resultType: "resolution",
            _value: 100,
          },
          {
            resultType: "rejection",
            _value: 200,
          },
        ];
      }

      return [
        {
          resultType: "resolution",
          _value: 300.00223,
        },
        {
          resultType: "rejection",
          _value: 400.00023,
        },
      ];
    });

    const result = await metrics.getFunctionMetrics(
      clusterId,
      serviceName,
      functionName,
      start,
      stop
    );

    expect(result).toEqual({
      success: {
        count: 100,
        avgExecutionTime: 300,
      },
      failure: {
        count: 200,
        avgExecutionTime: 400,
      },
    });
  })
})
