import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { DeviceStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WorkerDeviceCardProps {
  device: DeviceStatus;
}

export function WorkerDeviceCard({ device }: WorkerDeviceCardProps) {
  const statusColors = {
    Safe: 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500/50',
    Warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-500/50',
    Critical: 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500/50',
  };

  const textColors = {
    Safe: 'text-green-700 dark:text-green-400',
    Warning: 'text-yellow-700 dark:text-yellow-400',
    Critical: 'text-red-700 dark:text-red-400',
  };

  const icons = {
    Safe: <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />,
    Warning: <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />,
    Critical: <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />,
  };

  return (
    <Card className={cn("border-2 shadow-sm transition-all", statusColors[device.status])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold text-foreground">
          Device: {device.device_id}
        </CardTitle>
        {icons[device.status]}
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <span className={cn("text-3xl font-black uppercase tracking-wider", textColors[device.status])}>
            {device.status}
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Gas Level:</span>
            <span className="font-medium text-foreground">{device.current_readings?.gas || 0} ppm</span>
          </div>
          <div className="flex justify-between text-muted-foreground mt-1">
            <span>Temperature:</span>
            <span className="font-medium text-foreground">{device.current_readings?.temp || 0} °C</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
