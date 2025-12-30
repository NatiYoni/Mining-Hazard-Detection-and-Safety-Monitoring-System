'use client';

import React, { useEffect, useState } from 'react';
import { Alert } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { HighRiskDevices } from '@/components/dashboard/HighRiskDevices';
import { AlertHistoryTable } from '@/components/dashboard/AlertHistoryTable';
import { AlertsChart } from '@/components/dashboard/AlertsChart';
import { api } from '@/lib/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts');
        setAlerts(res.data || []);
      } catch (error) {
        console.error('Failed to fetch alerts', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // Calculate stats per device
  const deviceStats = alerts.reduce((acc, alert) => {
    acc[alert.device_id] = (acc[alert.device_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedDevices = Object.entries(deviceStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5

  return (
    <div className="p-6 space-y-8">
      <PageHeader title="Alert Center" />

      {/* Most Dangerous Devices */}
      <HighRiskDevices sortedDevices={sortedDevices} />

      {/* Alert Trends Chart */}
      <AlertsChart alerts={alerts} />

      {/* Alert History */}
      <AlertHistoryTable alerts={alerts} loading={loading} />
    </div>
  );
}
