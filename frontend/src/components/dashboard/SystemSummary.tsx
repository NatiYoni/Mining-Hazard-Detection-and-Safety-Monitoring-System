'use client';

import React from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { Activity, Thermometer, AlertOctagon, Users } from 'lucide-react';

export const SystemSummary = () => {
  const { devices } = useWebSocket();
  const deviceList = Array.from(devices.values());

  const total = deviceList.length;
  
  // Online logic: seen in last 60 seconds
  const now = new Date().getTime();
  const online = deviceList.filter(d => 
    now - new Date(d.last_seen).getTime() < 60000
  ).length;

  const critical = deviceList.filter(d => d.status === 'Critical').length;
  const warning = deviceList.filter(d => d.status === 'Warning').length;

  // Avg Temp (only from online devices with temp readings)
  const temps = deviceList
    .map(d => d.current_readings?.temp)
    .filter((t): t is number => typeof t === 'number');
  
  const avgTemp = temps.length > 0
    ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
    : '--';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <SummaryCard
        title="Total Devices"
        value={`${online} / ${total}`}
        subtext="Online Now"
        icon={<Users className="h-6 w-6 text-blue-600" />}
        color="bg-blue-50"
      />
      <SummaryCard
        title="Critical Alerts"
        value={critical.toString()}
        subtext="Requires Action"
        icon={<AlertOctagon className="h-6 w-6 text-red-600" />}
        color="bg-red-50"
        textColor="text-red-600"
      />
      <SummaryCard
        title="Warnings"
        value={warning.toString()}
        subtext="Monitor Closely"
        icon={<Activity className="h-6 w-6 text-yellow-600" />}
        color="bg-yellow-50"
        textColor="text-yellow-600"
      />
      <SummaryCard
        title="Avg Temperature"
        value={`${avgTemp}°C`}
        subtext="Mine Average"
        icon={<Thermometer className="h-6 w-6 text-green-600" />}
        color="bg-green-50"
      />
    </div>
  );
};

const SummaryCard = ({ 
  title, 
  value, 
  subtext, 
  icon, 
  color,
  textColor = 'text-gray-900'
}: { 
  title: string; 
  value: string; 
  subtext: string; 
  icon: React.ReactNode; 
  color: string;
  textColor?: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-1">{subtext}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);
