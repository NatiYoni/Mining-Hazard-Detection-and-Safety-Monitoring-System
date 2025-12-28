'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { SystemSummary } from '@/components/dashboard/SystemSummary';
import { DeviceTable } from '@/components/dashboard/DeviceTable';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'Worker') {
      router.push('/dashboard/worker');
    }
  }, [user, router]);

  if (!user || user.role === 'Worker') return null; // Loading or redirecting

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Alerts Panel */}
      <AlertsPanel />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* System Summary - Only for Admin */}
        {user.role === 'Admin' && (
          <div className="mb-8">
            <SystemSummary />
          </div>
        )}

        {/* Device Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Live Device Overview
          </h2>
          <DeviceTable />
        </div>

      </div>
    </div>
  );
}
