import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { Alert } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface AlertHistoryTableProps {
  alerts: Alert[];
  loading: boolean;
}

export function AlertHistoryTable({ alerts, loading }: AlertHistoryTableProps) {
  const [sortOrder, setSortOrder] = useState('newest');

  const sortedAlerts = useMemo(() => {
    const data = [...alerts];
    const getSeverityWeight = (s: string) => {
      switch(s?.toLowerCase()) {
        case 'critical': return 3;
        case 'warning': return 2;
        case 'info': return 1;
        default: return 0;
      }
    };

    return data.sort((a, b) => {
      const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
      const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
      
      switch (sortOrder) {
        case 'oldest':
          return dateA - dateB;
        case 'critical_high':
          const diffHigh = getSeverityWeight(b.severity) - getSeverityWeight(a.severity);
          return diffHigh !== 0 ? diffHigh : dateB - dateA;
        case 'critical_low':
          const diffLow = getSeverityWeight(a.severity) - getSeverityWeight(b.severity);
          return diffLow !== 0 ? diffLow : dateB - dateA;
        case 'newest':
        default:
          return dateB - dateA;
      }
    });
  }, [alerts, sortOrder]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Alert History</CardTitle>
        </div>
        <select 
          className="bg-background border border-input rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="critical_high">Criticality (High-Low)</option>
          <option value="critical_low">Criticality (Low-High)</option>
        </select>
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
            {sortedAlerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-foreground">
                  {(() => {
                    const dateStr = alert.created_at || alert.timestamp;
                    if (!dateStr) return 'N/A';
                    const date = new Date(dateStr);
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
            {sortedAlerts.length === 0 && !loading && (
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
