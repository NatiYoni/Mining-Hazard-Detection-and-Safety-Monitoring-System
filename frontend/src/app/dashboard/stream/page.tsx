'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSocket } from '@/context/WebSocketContext';
import { VideoPlayer } from '@/components/device/VideoPlayer';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function StreamPage() {
  const searchParams = useSearchParams();
  const { devices } = useWebSocket();
  
  // Only show online devices
  const deviceList = Array.from(devices.values()).filter(d => d.is_online);
  
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Auto-select from URL or default to first online device
  useEffect(() => {
    const paramId = searchParams.get('device');
    if (paramId && devices.has(paramId)) {
      setSelectedDeviceId(paramId);
    } else if (!selectedDeviceId && deviceList.length > 0) {
      setSelectedDeviceId(deviceList[0].device_id);
    }
  }, [searchParams, devices, deviceList, selectedDeviceId]);

  const selectedDevice = devices.get(selectedDeviceId);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Live Video Stream</h1>
      
      {/* Device Selector */}
      <div className="max-w-md">
        <label className="block text-sm font-medium text-muted-foreground mb-2">Select Device</label>
        <select 
          className="w-full p-2 border border-input rounded-md bg-background shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
        >
          <option value="">Select a device...</option>
          {deviceList.map(d => (
            <option key={d.device_id} value={d.device_id}>
              {d.device_id} ({d.status})
            </option>
          ))}
        </select>
      </div>

      {/* Video Player */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Live Feed</h2>
          {selectedDeviceId ? (
             <VideoPlayer deviceId={selectedDeviceId} /> 
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
              Select a device to view stream
            </div>
          )}
        </div>
        
        {/* Device Info */}
        {selectedDevice && (
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
             <h2 className="text-lg font-semibold mb-4 text-foreground">Device Status</h2>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Device ID</p>
                        <p className="font-medium text-foreground">{selectedDevice.device_id}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <StatusBadge status={selectedDevice.status} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Last Seen</p>
                        <p className="font-medium text-foreground">{new Date(selectedDevice.last_seen).toLocaleTimeString()}</p>
                    </div>
                </div>
                
                {selectedDevice.current_readings && (
                    <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-medium text-foreground mb-2">Current Readings</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(selectedDevice.current_readings).map(([key, value]) => (
                                <div key={key}>
                                    <p className="text-sm text-muted-foreground capitalize">{key}</p>
                                    <p className="font-medium text-foreground">{String(value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
