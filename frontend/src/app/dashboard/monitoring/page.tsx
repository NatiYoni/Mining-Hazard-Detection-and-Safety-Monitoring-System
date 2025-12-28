'use client';

import React, { useState } from 'react';
import { DeviceTable } from '@/components/dashboard/DeviceTable';
import { TimeRangeFilter } from '@/components/dashboard/TimeRangeFilter';

export default function MonitoringPage() {
  const [timeRange, setTimeRange] = useState('now');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Real-time Monitoring</h1>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <DeviceTable timeRange={timeRange} />
      </div>
    </div>
  );
}
