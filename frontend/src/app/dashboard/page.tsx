'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { SystemSummary } from '@/components/dashboard/SystemSummary';
import { DeviceTable } from '@/components/dashboard/DeviceTable';
import { LogOut, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Alerts Panel */}
      <AlertsPanel />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.name || 'Admin'}
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

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
