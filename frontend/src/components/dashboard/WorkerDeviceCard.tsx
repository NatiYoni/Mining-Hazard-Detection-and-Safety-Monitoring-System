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
    Safe: 'border-green-500 bg-green-50',
    Warning: 'border-yellow-500 bg-yellow-50',
    Critical: 'border-red-500 bg-red-50',
  };

  const textColors = {
    Safe: 'text-green-700',
    Warning: 'text-yellow-700',
    Critical: 'text-red-700',
  };

  const icons = {
    Safe: <CheckCircle className="h-8 w-8 text-green-600" />,
    Warning: <AlertTriangle className="h-8 w-8 text-yellow-600" />,
    Critical: <XCircle className="h-8 w-8 text-red-600" />,
  };

  return (
    <Card className={cn("border-2 shadow-sm transition-all", statusColors[device.status])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold text-gray-900">
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
        <div className="mt-4 pt-4 border-t border-gray-200/50 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Gas Level:</span>
            <span className="font-medium">{device.current_readings?.gas || 0} ppm</span>
          </div>
          <div className="flex justify-between text-gray-600 mt-1">
            <span>Temperature:</span>
            <span className="font-medium">{device.current_readings?.temp || 0} °C</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
