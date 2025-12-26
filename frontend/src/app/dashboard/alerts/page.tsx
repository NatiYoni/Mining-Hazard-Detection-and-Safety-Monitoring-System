'use client';

import React, { useEffect, useState } from 'react';
import { Alert } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { HighRiskDevices } from '@/components/dashboard/HighRiskDevices';
import { AlertHistoryTable } from '@/components/dashboard/AlertHistoryTable';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8080/api/v1/alerts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data || []);
        }
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

      {/* Alert History */}
      <AlertHistoryTable alerts={alerts} loading={loading} />
    </div>
  );
}
