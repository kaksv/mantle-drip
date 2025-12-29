"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * Reusable card wrapper for charts
 * Provides consistent styling and layout for all chart components
 */
export function ChartCard({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
}: ChartCardProps) {
  return (
    <Card className={`glass-card ${className || ""}`}>
      <CardHeader className={`px-3 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 ${headerClassName || ""}`}>
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs md:text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className={`px-3 md:px-6 pb-4 md:pb-6 ${contentClassName || ""}`}>
        {children}
      </CardContent>
    </Card>
  );
}





