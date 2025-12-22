"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Thermometer, Wind, Droplets } from "lucide-react";

interface RealTimeGaugeProps {
  type: "temperature" | "humidity" | "methane_level" | "dust_level";
  value: number;
  unit: string;
  status: "normal" | "warning" | "critical";
}

const icons = {
  temperature: Thermometer,
  humidity: Droplets,
  methane_level: Wind,
  dust_level: Activity,
};

const colors = {
  normal: "text-green-500",
  warning: "text-yellow-500",
  critical: "text-red-500",
};

const bgColors = {
  normal: "bg-green-50",
  warning: "bg-yellow-50",
  critical: "bg-red-50",
};

export function RealTimeGauge({ type, value, unit, status }: RealTimeGaugeProps) {
  const Icon = icons[type];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">
          {type.replace("_", " ")}
        </CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", colors[status])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toFixed(1)}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        </div>
        <p className={cn("text-xs mt-1 px-2 py-0.5 rounded-full inline-block font-medium", bgColors[status], colors[status])}>
          {status.toUpperCase()}
        </p>
      </CardContent>
    </Card>
  );
}
