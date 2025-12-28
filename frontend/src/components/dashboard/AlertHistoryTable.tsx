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
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border bg-muted/50">
        <History className="h-5 w-5 text-muted-foreground" />
        <CardTitle>Alert History</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground font-medium">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Device ID</th>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3">Message</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-foreground">
                  {(() => {
                    const date = new Date(alert.timestamp);
                    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
                  })()}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">{alert.device_id}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={alert.severity} />
                </td>
                <td className="px-6 py-4 text-muted-foreground">{alert.message}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium ${alert.acknowledged ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {alert.acknowledged ? 'Resolved' : 'Unresolved'}
                  </span>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
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
