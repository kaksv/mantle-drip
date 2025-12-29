"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";

export interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartData[];
  dataKeys: { key: string; name: string; color?: string }[];
  xAxisKey?: string;
  title: string;
  description?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
  formatter?: (value: any) => string;
}

/**
 * Line chart component for trends over time
 * Useful for showing withdrawal activity, outflow trends, etc.
 */
export function LineChart({
  data,
  dataKeys,
  xAxisKey = "name",
  title,
  description,
  height = 300,
  showGrid = true,
  showLegend = true,
  yAxisLabel,
  xAxisLabel,
  formatter,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title={title} description={description}>
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </div>
      </ChartCard>
    );
  }

  const defaultColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <ChartCard title={title} description={description}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
          <XAxis
            dataKey={xAxisKey}
            className="text-xs fill-muted-foreground"
            label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -5 } : undefined}
          />
          <YAxis
            className="text-xs fill-muted-foreground"
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined}
            tickFormatter={formatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            formatter={(value: any) => (formatter ? formatter(value) : value)}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: "12px" }} />}
          {dataKeys.map(({ key, name, color }, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={name}
              stroke={color || defaultColors[index % defaultColors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}





