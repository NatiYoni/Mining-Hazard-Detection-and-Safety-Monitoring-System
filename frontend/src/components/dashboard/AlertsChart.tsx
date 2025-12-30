'use client';

import React, { useState, useMemo } from 'react';
import { Alert } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface AlertsChartProps {
  alerts: Alert[];
}

export function AlertsChart({ alerts }: AlertsChartProps) {
  const [timeRange, setTimeRange] = useState('week');
  const [chartType, setChartType] = useState('bar');

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

  const pieData = useMemo(() => {
    const totals = { Critical: 0, Warning: 0, Info: 0 };
    chartData.forEach(d => {
      totals.Critical += d.Critical;
      totals.Warning += d.Warning;
      totals.Info += d.Info;
    });
    return [
      { name: 'Critical', value: totals.Critical, color: '#ef4444' },
      { name: 'Warning', value: totals.Warning, color: '#f97316' },
      { name: 'Info', value: totals.Info, color: '#3b82f6' },
    ].filter(d => d.value > 0);
  }, [chartData]);

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: 0, bottom: 0 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }} itemStyle={{ color: 'var(--foreground)' }} />
            <Legend />
            <Line type="monotone" dataKey="Critical" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="Warning" stroke="#f97316" strokeWidth={2} />
            <Line type="monotone" dataKey="Info" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }} itemStyle={{ color: 'var(--foreground)' }} />
            <Legend />
            <Area type="monotone" dataKey="Critical" stackId="1" stroke="#ef4444" fill="#ef4444" />
            <Area type="monotone" dataKey="Warning" stackId="1" stroke="#f97316" fill="#f97316" />
            <Area type="monotone" dataKey="Info" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }} itemStyle={{ color: 'var(--foreground)' }} />
            <Legend />
          </PieChart>
        );
      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }} itemStyle={{ color: 'var(--foreground)' }} />
            <Legend />
            <Bar dataKey="Critical" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Warning" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Info" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 pb-2">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Alert Trends</CardTitle>
          <Tabs defaultValue="week" value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex justify-end">
          <Tabs defaultValue="bar" value={chartType} onValueChange={setChartType}>
            <TabsList className="grid w-[300px] grid-cols-4">
              <TabsTrigger value="bar">Bar</TabsTrigger>
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="area">Area</TabsTrigger>
              <TabsTrigger value="pie">Pie</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
