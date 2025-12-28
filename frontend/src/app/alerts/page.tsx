'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HighRiskDevices } from '@/components/dashboard/HighRiskDevices';
import { AlertHistoryTable } from '@/components/dashboard/AlertHistoryTable';
import { useWebSocket } from '@/context/WebSocketContext';
import { api } from '@/lib/api';
import { Alert } from '@/types';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function AlertsPage() {
  const { devices } = useWebSocket();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch alert history
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts');
        setAlerts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  // Calculate High Risk Devices
  // Logic:
  // 1. Must be Online (seen in last 60s)
  // 2. Must have active status (Critical or Warning)
  // 3. Sort by Severity (Critical > Warning)
  const now = new Date().getTime();
  const highRiskDevices = Array.from(devices.values())
    .filter(d => {
      const isOnline = now - new Date(d.last_seen).getTime() < 60000;
      const hasRisk = d.status === 'Critical' || d.status === 'Warning';
      return isOnline && hasRisk;
    })
    .map(d => {
      // Calculate a "risk score" for sorting
      // Critical = 2, Warning = 1
      let score = 0;
      if (d.status === 'Critical') score = 2;
      else if (d.status === 'Warning') score = 1;
      
      // Count total alerts for this device from history to show "Total Alerts"
      const totalAlerts = alerts.filter(a => a.device_id === d.device_id).length;
      
      return {
        deviceId: d.device_id,
        score,
        totalAlerts
      };
    })
    .sort((a, b) => b.score - a.score) // Highest risk first
    .map(d => [d.deviceId, d.totalAlerts] as [string, number]);

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-card">
        <Sidebar />
      </div>
      <main className="md:pl-72">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-6">Alert Center</h1>
          
          <Tabs defaultValue="high-risk" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="high-risk">High Risk Devices</TabsTrigger>
              <TabsTrigger value="history">Alert History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="high-risk">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Showing currently online devices with active Critical or Warning status.
                </p>
                <HighRiskDevices sortedDevices={highRiskDevices} />
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <AlertHistoryTable alerts={alerts} loading={loading} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
