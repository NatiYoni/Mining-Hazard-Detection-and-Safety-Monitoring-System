'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { SystemSummary } from '@/components/dashboard/SystemSummary';
import { DeviceTable } from '@/components/dashboard/DeviceTable';
import { TimeRangeFilter } from '@/components/dashboard/TimeRangeFilter';
import { AlertsChart } from '@/components/dashboard/AlertsChart';
import { api } from '@/lib/api';
import { Alert } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('1d');
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (user?.role === 'Worker') {
      router.push('/dashboard/worker');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts');
        const sortedAlerts = (res.data || []).sort((a: Alert, b: Alert) => {
          const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
          const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
          return dateB - dateA;
        });
        setAlerts(sortedAlerts);
      } catch (error) {
        console.error('Failed to fetch alerts', error);
      }
    };
    fetchAlerts();
  }, []);

  if (!user || user.role === 'Worker') return null; // Loading or redirecting

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Alerts Panel */}
      <AlertsPanel timeRange={timeRange} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Time Range Filter */}
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />

        {/* System Summary - Only for Admin */}
        {user.role === 'Admin' && (
          <div className="mb-8">
            <SystemSummary />
          </div>
        )}

        {/* Alert Trends Chart */}
        <div className="mb-8">
           <AlertsChart alerts={alerts} />
        </div>

        {/* Device Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Live Device Overview
          </h2>
          <DeviceTable timeRange={timeRange} />
        </div>

      </div>
    </div>
  );
}
