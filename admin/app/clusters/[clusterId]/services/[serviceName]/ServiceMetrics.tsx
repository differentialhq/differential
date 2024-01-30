"use client";

import { client } from "@/client/client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ServiceMetrics({
  clusterId,
  serviceName,
}: {
  clusterId: string;
  serviceName: string;
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [data, setData] = useState<{
    count: Array<{
      timestamp: Date;
      success: number;
      failure: number;
      stalled: number;
    }>;
    executionTime: Array<{
      timestamp: Date;
      avg: number;
    }>;
  }>({
    count: [],
    executionTime: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const metricsResult = await client.getMetrics({
        headers: {
          authorization: `Bearer ${await getToken()}`,
        },
        params: {
          clusterId: clusterId,
        },
        query: {
          serviceName: serviceName,
        },
      });

      if (metricsResult.status === 401) {
        window.location.reload();
      }

      if (metricsResult.status === 200) {
        setData({
          count: metricsResult.body.timeseries
            .sort((a, b) => a.timeBin.localeCompare(b.timeBin))
            .map((item) => ({
              timestamp: new Date(item.timeBin),
              success: item.totalJobResulted,
              failure: item.rejectionCount,
              stalled: item.totalJobStalled,
            })),
          executionTime: metricsResult.body.timeseries
            .sort((a, b) => a.timeBin.localeCompare(b.timeBin))
            .map((item) => ({
              timestamp: new Date(item.timeBin),
              avg: item.avgExecutionTime,
            })),
        });
      } else {
        toast.error("Failed to fetch service metrics.");
      }
    };

    // initial fetch
    fetchData();

    const interval = setInterval(fetchData, 60 * 1000); // Run every minute

    return () => {
      clearInterval(interval); // Clear the interval when the component unmounts
    };
  }, [clusterId, serviceName, isLoaded, isSignedIn, getToken]);

  console.log(data);

  return data.count.length > 0 ? (
    <div>
      <div className="flex mt-12 space-x-12 mb-12">
        <div className="rounded-md border flex-grow">
          <div className="mt-6 text-center">
            <h4 className="text-l mb-4">Service Calls</h4>
            <p className="text-gray-400">
              Number of times {serviceName} has been called.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              width={500}
              height={500}
              margin={{
                right: 30,
                left: 30,
                bottom: 30,
              }}
              data={data.count}
            >
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", color: "#fff" }}
                formatter={(value, _name, props) => {
                  if (
                    isNaN(value as number) ||
                    isNaN(props.payload.success) ||
                    isNaN(props.payload.failure) ||
                    props.payload.success + props.payload.failure === 0
                  ) {
                    return value;
                  }

                  const percent =
                    ((value as number) /
                      (props.payload.success + props.payload.failure)) *
                    100;
                  return `${value} (${percent.toFixed(2)}%)`;
                }}
              />
              <YAxis dataKey="success" />
              <XAxis
                dataKey="timestamp"
                name="Time"
                tickFormatter={tickFormatter}
              />
              <Area
                type="monotone"
                dataKey="success"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="failure"
                stroke="#b30000"
                fill="#b30000"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border flex-grow">
          <div className="mt-6 text-center">
            <h4 className="text-l mb-4">Average Execution Time</h4>
            <p className="text-gray-400">
              The average time to execute {serviceName} functions.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              width={500}
              height={500}
              margin={{
                top: 30,
                right: 30,
                left: 30,
                bottom: 30,
              }}
              data={data.executionTime}
            >
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", color: "#fff" }}
                formatter={(value, _name, props) => {
                  return `${value}ms`;
                }}
              />
              <YAxis unit="ms" />
              <XAxis dataKey="timestamp" tickFormatter={tickFormatter} />
              <Area
                type="monotone"
                dataKey="avg"
                stroke="#8884d8"
                fill="#8884d8"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  ) : null;
}

const tickFormatter = (time: number) => {
  // Hour and minute (e.g. 12:00) including leading zero
  const date = new Date(time);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
