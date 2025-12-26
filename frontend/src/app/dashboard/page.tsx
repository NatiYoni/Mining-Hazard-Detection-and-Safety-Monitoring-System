'use client';

import React from 'react';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { SystemSummary } from '@/components/dashboard/SystemSummary';
import { DeviceTable } from '@/components/dashboard/DeviceTable';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Alerts Panel */}
      <AlertsPanel />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* System Summary */}
        <SystemSummary />

        {/* Device Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Live Device Overview
          </h2>
          <DeviceTable />
        </div>

      </div>
    </div>
  );
}
