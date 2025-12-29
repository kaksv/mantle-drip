"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";

export interface AreaChartData {
  name: string;
  [key: string]: string | number;
}

interface AreaChartProps {
  data: AreaChartData[];
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
  stacked?: boolean;
}

/**
 * Area chart component for cumulative data
 * Useful for showing outflow over time, cumulative distributions, etc.
 */
export function AreaChart({
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
  stacked = false,
}: AreaChartProps) {
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
        <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={name}
              stackId={stacked ? "1" : undefined}
              stroke={color || defaultColors[index % defaultColors.length]}
              fill={color || defaultColors[index % defaultColors.length]}
              fillOpacity={0.6}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}





