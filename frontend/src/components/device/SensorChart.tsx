'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface DataPoint {
  time: string;
  value: number;
}

interface SensorChartProps {
  data: DataPoint[];
  color: string;
  unit: string;
  threshold?: number;
  title: string;
}

export const SensorChart = ({ data, color, unit, threshold, title }: SensorChartProps) => {
  return (
    <div className="bg-card p-4 rounded-xl shadow-sm border border-border h-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-card-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">Last 10 Minutes</span>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            unit={unit} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ color: '#6b7280', fontSize: '12px' }}
          />
          
          {threshold && (
            <ReferenceLine 
              y={threshold} 
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              label={{ 
                value: 'CRITICAL', 
                fill: '#ef4444', 
                fontSize: 10, 
                position: 'right' 
              }} 
            />
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
