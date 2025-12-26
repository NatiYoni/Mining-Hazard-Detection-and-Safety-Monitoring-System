'use client';

import React from 'react';
import { DeviceTable } from '@/components/dashboard/DeviceTable';

export default function MonitoringPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Real-time Monitoring</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <DeviceTable />
      </div>
    </div>
  );
}
