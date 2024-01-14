"use client";

import { client } from "@/client/client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

export function ServiceMetrics({
  clusterId,
  serviceName,
  functionName,
}: {
  clusterId: string;
  serviceName: string;
  functionName?: string;
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [data, setData] = useState<{
    count: Array<{
      timestamp: Date;
      success: number;
      failure: number;
    }>;
  }>({
    count: [],
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
          start: new Date(Date.now() - 1000 * 60 * 60),
          stop: new Date(Date.now()),
          functionName: functionName,
          serviceName: serviceName,
        },
      });

      if (metricsResult.status === 401) {
        window.location.reload();
      }

      if (metricsResult.status === 200) {
        // Merge the success and failure counts into a single map for rendering
        const countMap = new Map();
        metricsResult.body.success.count.forEach(
          (item: { value: number; timestamp: Date }) =>
            attributePoint(countMap, item, "success"),
        );
        metricsResult.body.failure.count.forEach(
          (item: { value: number; timestamp: Date }) =>
            attributePoint(countMap, item, "failure"),
        );

        setData({
          count: Array.from(countMap.values()),
        });
      } else {
        toast.error("Failed to fetch service metrics.");
      }
    };

    // initial fetch
    fetchData();

    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(interval); // Clear the interval when the component unmounts
    };
  }, [clusterId, serviceName, isLoaded, isSignedIn, getToken]);

  return data.count.length > 0 ? (
    <div>
      <div className="mt-12">
        <h2 className="text-xl mb-4">Service Calls</h2>
        <p className="text-gray-400 mb-8">
          Number of times {serviceName} has been called in the last hour.
        </p>
      </div>
      <div className="rounded-md border" style={{ maxWidth: 1276 }}>
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
              tickFormatter={(time) => {
                const date = new Date(time);
                return `${date.getHours()}:${date.getMinutes()}`;
              }}
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
              stroke="#82ca9d"
              fill="#82ca9d"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  ) : null;
}

const attributePoint = (
  pointMap: Map<Date, { success: number; failure: number; timestamp: Date }>,
  item: { value: number; timestamp: Date },
  type: "success" | "failure",
) => {
  console.log(pointMap);
  const existing = pointMap.get(item.timestamp);
  if (existing) {
    existing[type] = item.value;
  } else {
    pointMap.set(item.timestamp, {
      timestamp: item.timestamp,
      success: 0,
      failure: 0,
    });
    attributePoint(pointMap, item, type);
  }
};
