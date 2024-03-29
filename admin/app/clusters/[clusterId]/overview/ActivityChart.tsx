"use client";

import { formatRelative } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fillDates } from "../../fill-dates";
import { tickFormatter } from "../services/[serviceName]/ServiceMetrics";

const stringToColour = (str: string) => {
  let hash = 0;
  str.split("").forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, "0");
  }
  return colour;
};

export function ActivityChart<T extends { timestamp: Date }>({
  activity,
  series,
}: {
  activity: Array<T>;
  series: string[];
}) {
  const sorted = activity.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  const earliest = sorted[0]?.timestamp;

  if (!earliest) {
    return null;
  }

  const filled = Object.values(
    fillDates(sorted)
      .concat(activity)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .reduce(
        (acc, curr) => {
          const key = curr.timestamp.getTime();

          acc[key] = acc[key] || {
            timestamp: curr.timestamp,
          };

          acc[key] = {
            ...acc[key],
            ...curr,
          };

          return acc;
        },
        {} as Record<string, any>,
      ),
  );

  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart
        data={filled}
        width={500}
        height={500}
        margin={{
          right: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <Tooltip
          contentStyle={{ backgroundColor: "#1F2937", color: "#fff" }}
          labelFormatter={(value) => {
            return formatRelative(new Date(value), new Date());
          }}
        />
        <XAxis
          dataKey="timestamp"
          name="Time"
          tickFormatter={tickFormatter}
          style={{
            fontSize: "12px",
          }}
        />
        <CartesianGrid strokeDasharray="1 1" strokeOpacity={0.2} />
        <YAxis
          style={{
            fontSize: "12px",
          }}
        />
        {series.map((s, i) => (
          <Bar
            key={s}
            dataKey={s}
            type="monotone"
            fill={stringToColour(s)}
            stackId={s.split(":")[0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
