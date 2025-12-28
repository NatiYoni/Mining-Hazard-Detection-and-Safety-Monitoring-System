import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HighRiskDevicesProps {
  sortedDevices: [string, number][];
}

export function HighRiskDevices({ sortedDevices }: HighRiskDevicesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
        <CardTitle>High Risk Devices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {sortedDevices.map(([deviceId, count], index) => (
            <div key={deviceId} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
              <div>
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">#{index + 1} Most Critical</span>
                <p className="text-lg font-bold text-foreground">{deviceId.slice(0, 8)}...</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{count}</span>
                <p className="text-xs text-red-500 dark:text-red-300">Total Alerts</p>
              </div>
            </div>
          ))}
          {sortedDevices.length === 0 && (
            <p className="text-muted-foreground col-span-3 text-center py-4">No high-risk online devices detected.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
