'use client';

import React, { useState, useMemo } from 'react';
import { Alert } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AlertsChartProps {
  alerts: Alert[];
}

export function AlertsChart({ alerts }: AlertsChartProps) {
  const [timeRange, setTimeRange] = useState('week');

  const chartData = useMemo(() => {
    const now = new Date();
    let filteredAlerts = alerts;
    let formatLabel = (date: Date) => date.toLocaleDateString();

    if (timeRange === 'today') {
      filteredAlerts = alerts.filter(a => {
        const d = new Date(a.created_at || a.timestamp || '');
        return d.toDateString() === now.toDateString();
      });
      formatLabel = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredAlerts = alerts.filter(a => {
        const d = new Date(a.created_at || a.timestamp || '');
        return d >= weekAgo;
      });
      formatLabel = (date: Date) => date.toLocaleDateString([], { weekday: 'short' });
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredAlerts = alerts.filter(a => {
        const d = new Date(a.created_at || a.timestamp || '');
        return d >= monthAgo;
      });
      formatLabel = (date: Date) => date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    }

    // Group by label
    const groups: Record<string, { name: string; Critical: number; Warning: number; Info: number }> = {};
    
    filteredAlerts.forEach(a => {
      const d = new Date(a.created_at || a.timestamp || '');
      if (isNaN(d.getTime())) return;
      
      const label = formatLabel(d);
      if (!groups[label]) {
        groups[label] = { name: label, Critical: 0, Warning: 0, Info: 0 };
      }
      // Normalize severity case if needed, assuming 'Critical', 'Warning', 'Info'
      const severity = a.severity as 'Critical' | 'Warning' | 'Info';
      if (groups[label][severity] !== undefined) {
         groups[label][severity]++;
      }
    });

    return Object.values(groups);
  }, [alerts, timeRange]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Alert Trends</CardTitle>
        <Tabs defaultValue="week" value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              <Bar dataKey="Critical" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Warning" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Info" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
