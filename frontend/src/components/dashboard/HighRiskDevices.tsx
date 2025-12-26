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
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <CardTitle>High Risk Devices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {sortedDevices.map(([deviceId, count], index) => (
            <div key={deviceId} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div>
                <span className="text-sm text-red-600 font-medium">#{index + 1} Most Critical</span>
                <p className="text-lg font-bold text-gray-900">{deviceId}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-red-600">{count}</span>
                <p className="text-xs text-red-500">Total Alerts</p>
              </div>
            </div>
          ))}
          {sortedDevices.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center py-4">No alerts recorded yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
