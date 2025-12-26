'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsSection } from '@/components/dashboard/SettingsSection';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Settings" 
        description="Manage your account settings and preferences."
      />

      <div className="grid gap-8">
        {/* Profile Section */}
        <SettingsSection title="Profile Information" icon={User}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <input 
                  type="text" 
                  disabled 
                  value={user?.username || ''} 
                  className="flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <input 
                  type="email" 
                  disabled 
                  value={user?.email || ''} 
                  className="flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <input 
                  type="text" 
                  disabled 
                  value={user?.role || ''} 
                  className="flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection title="Security" icon={Lock}>
          <form className="space-y-6 max-w-xl">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Current Password</label>
                <input 
                  type="password" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <input 
                  type="password" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                <input 
                  type="password" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <button 
              type="button" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Change Password
            </button>
          </form>
        </SettingsSection>

        {/* Privacy & Policy */}
        <SettingsSection title="Privacy & Policy" icon={Shield}>
          <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
            <p>
              <strong className="text-foreground">Data Collection:</strong> We collect real-time sensor data (temperature, gas levels, vibration) and video feeds solely for the purpose of safety monitoring and hazard detection.
            </p>
            <p>
              <strong className="text-foreground">Data Retention:</strong> Alert history is retained for 1 year for compliance and safety auditing. Video feeds are not stored permanently unless flagged as a critical incident.
            </p>
            <p>
              <strong className="text-foreground">User Rights:</strong> You have the right to request access to your personal data and activity logs. Contact the system administrator for any privacy concerns.
            </p>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
