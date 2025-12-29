"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";

export interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartData[];
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
  layout?: "horizontal" | "vertical";
}

/**
 * Bar chart component for comparisons
 * Useful for showing deposits by token, recipients distribution, etc.
 */
export function BarChart({
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
  layout = "vertical",
}: BarChartProps) {
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
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
          <XAxis
            type={layout === "horizontal" ? "number" : "category"}
            dataKey={layout === "horizontal" ? undefined : xAxisKey}
            className="text-xs fill-muted-foreground"
            label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -5 } : undefined}
          />
          <YAxis
            type={layout === "horizontal" ? "category" : "number"}
            dataKey={layout === "horizontal" ? xAxisKey : undefined}
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
            <Bar
              key={key}
              dataKey={key}
              name={name}
              fill={color || defaultColors[index % defaultColors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}





