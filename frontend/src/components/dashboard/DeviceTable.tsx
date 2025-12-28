'use client';

import React, { useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { DeviceStatus } from '@/types';
import Link from 'next/link';
import { ArrowUpDown, Eye, Video } from 'lucide-react';

type SortField = 'status' | 'temp' | 'gas' | 'last_seen';

export const DeviceTable = () => {
  const { devices } = useWebSocket();
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to desc for numbers usually
    }
  };

  const sortedDevices = Array.from(devices.values()).sort((a, b) => {
    let valA: any, valB: any;

    switch (sortField) {
      case 'status':
        // Critical > Warning > Safe
        const rank = { Critical: 3, Warning: 2, Safe: 1 };
        valA = rank[a.status] || 0;
        valB = rank[b.status] || 0;
        break;
      case 'temp':
        valA = a.current_readings?.temp || -999;
        valB = b.current_readings?.temp || -999;
        break;
      case 'gas':
        valA = a.current_readings?.gas || -1;
        valB = b.current_readings?.gas || -1;
        break;
      case 'last_seen':
        valA = new Date(a.last_seen).getTime();
        valB = new Date(b.last_seen).getTime();
        break;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="p-4">Device ID</th>
              <th 
                className="p-4 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th 
                className="p-4 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort('temp')}
              >
                <div className="flex items-center gap-1">
                  Temp (°C) <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th 
                className="p-4 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort('gas')}
              >
                <div className="flex items-center gap-1">
                  Gas (PPM) <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-4">Motion</th>
              <th 
                className="p-4 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSort('last_seen')}
              >
                <div className="flex items-center gap-1">
                  Last Update <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedDevices.map((device) => (
              <DeviceRow key={device.device_id} device={device} />
            ))}
            {sortedDevices.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No devices connected.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DeviceRow = ({ device }: { device: DeviceStatus }) => {
  const statusColors = {
    Safe: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse',
    Offline: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const isFall = device.current_readings?.fall;

  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="p-4 font-mono text-muted-foreground">
        {device.device_id.slice(0, 8)}...
      </td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${device.is_online ? statusColors[device.status] : statusColors['Offline']}`}>
          {device.is_online ? device.status.toUpperCase() : 'OFFLINE'}
        </span>
      </td>
      <td className="p-4 font-medium text-foreground">
        {device.current_readings?.temp?.toFixed(1) || '--'}°C
      </td>
      <td className="p-4 font-medium text-foreground">
        {device.current_readings?.gas || '--'}
      </td>
      <td className="p-4">
        {isFall ? (
          <span className="text-red-600 dark:text-red-400 font-bold">FALL DETECTED</span>
        ) : (
          <span className="text-muted-foreground">Normal</span>
        )}
      </td>
      <td className="p-4 text-muted-foreground text-xs">
        {new Date(device.last_seen).toLocaleTimeString()}
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link 
            href={`/dashboard/device/${device.device_id}`}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link 
            href={`/dashboard/stream?device=${device.device_id}`}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            title="Watch Video"
          >
            <Video className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
};
