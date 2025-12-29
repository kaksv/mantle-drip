"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
  description?: string;
  height?: number;
  showLegend?: boolean;
  formatter?: (value: any) => string;
  innerRadius?: number;
  outerRadius?: number;
  label?: boolean | ((entry: any) => string);
}

/**
 * Pie chart component for distributions
 * Useful for showing stream status distribution, token distribution, etc.
 */
export function PieChart({
  data,
  title,
  description,
  height = 300,
  showLegend = true,
  formatter,
  innerRadius = 0,
  outerRadius = 80,
  label,
}: PieChartProps) {
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

  // Use provided colors or default colors
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }));

  return (
    <ChartCard title={title} description={description}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={label}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || defaultColors[index % defaultColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            formatter={(value: any) => (formatter ? formatter(value) : value)}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => {
                const item = chartData.find((d) => d.name === value);
                return item ? `${value} (${formatter ? formatter(item.value) : item.value})` : value;
              }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}





