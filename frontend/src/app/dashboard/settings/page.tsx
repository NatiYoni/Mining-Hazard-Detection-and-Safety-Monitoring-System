'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsSection } from '@/components/dashboard/SettingsSection';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <PageHeader title="Settings" />

      {/* Profile Section */}
      <SettingsSection title="Profile Information" icon={User}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input 
                type="text" 
                disabled 
                value={user?.username || ''} 
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                disabled 
                value={user?.email || ''} 
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <input 
                type="text" 
                disabled 
                value={user?.role || ''} 
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Security Section */}
      <SettingsSection title="Security" icon={Lock}>
        <form className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input type="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
            Change Password
          </button>
        </form>
      </SettingsSection>

      {/* Privacy & Policy */}
      <SettingsSection title="Privacy & Policy" icon={Shield}>
        <div className="text-sm text-gray-600 space-y-4">
          <p>
            <strong>Data Collection:</strong> We collect real-time sensor data (temperature, gas levels, vibration) and video feeds solely for the purpose of safety monitoring and hazard detection.
          </p>
          <p>
            <strong>Data Retention:</strong> Alert history is retained for 1 year for compliance and safety auditing. Video feeds are not stored permanently unless flagged as a critical incident.
          </p>
          <p>
            <strong>User Rights:</strong> You have the right to request access to your personal data and activity logs. Contact the system administrator for any privacy concerns.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}
