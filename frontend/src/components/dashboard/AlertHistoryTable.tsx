import React from 'react';
import { History } from 'lucide-react';
import { Alert } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface AlertHistoryTableProps {
  alerts: Alert[];
  loading: boolean;
}

export function AlertHistoryTable({ alerts, loading }: AlertHistoryTableProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 border-b bg-gray-50/50">
        <History className="h-5 w-5 text-gray-500" />
        <CardTitle>Alert History</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Device ID</th>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3">Message</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900">
                  {new Date(alert.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{alert.device_id}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={alert.severity} />
                </td>
                <td className="px-6 py-4 text-gray-600">{alert.message}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs ${alert.acknowledged ? 'text-green-600' : 'text-orange-600'}`}>
                    {alert.acknowledged ? 'Resolved' : 'Active'}
                  </span>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No history available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
