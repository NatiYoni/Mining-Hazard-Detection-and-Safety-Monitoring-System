'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/context/WebSocketContext';
import { DeviceHeader } from '@/components/device/DeviceHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ArrowLeft, Thermometer, Activity, AlertTriangle } from 'lucide-react';

export default function DeviceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { devices } = useWebSocket();
  const device = devices.get(id);

  if (!device) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Device Not Found</h2>
          <p className="text-muted-foreground">The device with ID {id} could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DeviceHeader device={device} />

      <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Card */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Status</h3>
          <div className="flex items-center justify-between">
            <StatusBadge status={device.status} />
            <span className={`text-sm font-medium ${device.is_online ? 'text-green-500' : 'text-gray-500'}`}>
              {device.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Temperature Card */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Temperature</h3>
          </div>
          <p className="text-2xl font-bold">
            {device.current_readings?.temp?.toFixed(1) || '--'}°C
          </p>
        </div>

        {/* Gas Card */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Gas Level</h3>
          </div>
          <p className="text-2xl font-bold">
            {device.current_readings?.gas?.toFixed(1) || '--'} PPM
          </p>
        </div>
      </div>

      {/* Raw Data / Debug Info */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <h3 className="text-lg font-semibold mb-4">Raw Sensor Data</h3>
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
          {JSON.stringify(device, null, 2)}
        </pre>
      </div>
    </div>
  );
}
