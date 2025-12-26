'use client';

import React from 'react';
import { DeviceTable } from '@/components/dashboard/DeviceTable';

export default function MonitoringPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Real-time Monitoring</h1>
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <DeviceTable />
      </div>
    </div>
  );
}
