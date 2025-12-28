'use client';

import React from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { DeviceStatus } from '@/types';

export const AlertsPanel = ({ timeRange = '1d' }: { timeRange?: string }) => {
  const { devices } = useWebSocket();

  const filterByTimeRange = (device: DeviceStatus) => {
    if (timeRange === 'all') return true;
    
    const now = Date.now();
    const lastSeen = new Date(device.last_seen).getTime();
    const diff = now - lastSeen;

    if (timeRange === 'now') {
      return device.status !== 'Offline' && diff < 30000;
    }

    const ranges: { [key: string]: number } = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
    };

    return diff <= (ranges[timeRange] || ranges['1d']);
  };

  // Derive active alerts from devices status
  // In a real app, we might also fetch historical alerts from an API
  const activeAlerts = Array.from(devices.values())
    .filter((d) => d.status !== 'Safe' && filterByTimeRange(d))
    .sort((a, b) => {
      // Sort by severity (Critical > Warning)
      if (a.status === 'Critical' && b.status !== 'Critical') return -1;
      if (b.status === 'Critical' && a.status !== 'Critical') return 1;
      // Then by recency (newest first)
      return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
    });

  if (activeAlerts.length === 0) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-card shadow-md border-b border-border max-h-64 overflow-y-auto">
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Active Alerts ({activeAlerts.length})
        </h3>
        <div className="grid gap-2">
          {activeAlerts.map((device) => (
            <AlertCard key={device.device_id} device={device} />
          ))}
        </div>
      </div>
    </div>
  );
};

const AlertCard = ({ device }: { device: DeviceStatus }) => {
  const isCritical = device.status === 'Critical';
  
  // Determine cause text
  const getCause = (d: DeviceStatus) => {
    const p = d.current_readings || {};
    if (p.fall) return 'FALL DETECTED';
    if ((p.gas || 0) > 700) return 'GAS LEAK DETECTED';
    if ((p.temp || 0) > 38) return 'CRITICAL HEAT';
    if ((p.temp || 0) > 31) return 'HIGH HEAT';
    return 'UNKNOWN HAZARD';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString();
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
        isCritical
          ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500/50 text-red-900 dark:text-red-300'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-500/50 text-yellow-900 dark:text-yellow-300'
      }`}
    >
      <div className="flex items-center gap-3">
        {isCritical ? (
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 animate-pulse" />
        ) : (
          <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
        )}
        <div>
          <div className="font-bold text-sm">
            Device: {device.device_id.slice(0, 8)}...
          </div>
          <div className="text-xs opacity-90 font-medium">
            {getCause(device)}
          </div>
        </div>
      </div>
      <div className="text-xs opacity-75">
        {formatTime(device.last_seen)}
      </div>
    </div>
  );
};
