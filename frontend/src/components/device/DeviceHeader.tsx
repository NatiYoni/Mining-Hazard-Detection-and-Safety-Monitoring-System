'use client';

import React from 'react';
import { DeviceStatus } from '@/types';
import { ArrowLeft, Clock, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export const DeviceHeader = ({ device }: { device: DeviceStatus }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const statusColors = {
    Safe: 'bg-success/10 text-success border-success/20',
    Warning: 'bg-warning/10 text-warning border-warning/20',
    Critical: 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse',
  };

  return (
    <div className="bg-background border-b border-border px-4 py-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link 
                href="/dashboard"
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
            )}
            
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  Device: {device.device_id.slice(0, 8)}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${statusColors[device.status]}`}>
                  {device.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Worker: Assigned Miner</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Sector 4B</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Last Seen: {new Date(device.last_seen).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase">Temperature</p>
              <p className="text-xl font-mono font-bold text-gray-900">
                {device.current_readings?.temp?.toFixed(1) || '--'}°C
              </p>
            </div>
            <div className="text-right border-l pl-4">
              <p className="text-xs text-gray-400 uppercase">Gas Level</p>
              <p className="text-xl font-mono font-bold text-gray-900">
                {device.current_readings?.gas || '--'} PPM
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
