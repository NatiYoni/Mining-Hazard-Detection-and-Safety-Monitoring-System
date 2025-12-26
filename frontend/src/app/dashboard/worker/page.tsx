'use client';

import React from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDeviceCard } from '@/components/dashboard/WorkerDeviceCard';

export default function WorkerSafetyPage() {
  const { devices } = useWebSocket();
  const deviceList = Array.from(devices.values());

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Safety Check" 
        description="Check the safety status of devices in your area before entering." 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deviceList.map((device) => (
          <WorkerDeviceCard key={device.device_id} device={device} />
        ))}
      </div>
    </div>
  );
}
