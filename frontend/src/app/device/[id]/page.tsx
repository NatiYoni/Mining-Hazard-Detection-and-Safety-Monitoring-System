'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWebSocket } from '@/context/WebSocketContext';
import { DeviceHeader } from '@/components/device/DeviceHeader';
import { VideoPlayer } from '@/components/device/VideoPlayer';
import { SensorChart } from '@/components/device/SensorChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { Activity, Flame, Thermometer, Video } from 'lucide-react';

// Mock history data generator (since we don't have a history API yet)
const generateMockHistory = (length: number, base: number, variance: number) => {
  return Array.from({ length }).map((_, i) => ({
    time: new Date(Date.now() - (length - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: base + Math.random() * variance - variance / 2
  }));
};

export default function DeviceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { devices } = useWebSocket();
  const [activeTab, setActiveTab] = useState<'overview' | 'heat' | 'gas' | 'motion'>('overview');

  // Get live device data
  const device = devices.get(id) || {
    device_id: id,
    status: 'Safe',
    is_online: false,
    last_seen: new Date().toISOString(),
    current_readings: {}
  };

  // Mock Data for Charts (Replace with API fetch in production)
  const [tempHistory, setTempHistory] = useState(generateMockHistory(20, 32, 2));
  const [gasHistory, setGasHistory] = useState(generateMockHistory(20, 200, 50));

  // Update history with live data
  useEffect(() => {
    if (device.current_readings?.temp) {
      setTempHistory(prev => [
        ...prev.slice(1),
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: device.current_readings!.temp! }
      ]);
    }
    if (device.current_readings?.gas) {
      setGasHistory(prev => [
        ...prev.slice(1),
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: device.current_readings!.gas! }
      ]);
    }
  }, [device.last_seen]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AlertsPanel />
      
      <DeviceHeader device={device} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Video & Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-600" />
                Live Feed
              </h3>
              {/* Pass a mock IP or real one if available */}
              <VideoPlayer deviceId={id} /> 
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Device Health</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Battery</span>
                  <span className="font-medium text-green-600">92%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Signal Strength</span>
                  <span className="font-medium text-blue-600">-65 dBm (Good)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uptime</span>
                  <span className="font-medium text-gray-900">4h 12m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tabs & Charts */}
          <div className="lg:col-span-2">
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mb-6 w-fit">
              {['overview', 'heat', 'gas', 'motion'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              
              {(activeTab === 'overview' || activeTab === 'heat') && (
                <SensorChart 
                  title="Temperature Trend"
                  data={tempHistory}
                  color="#f59e0b"
                  unit="°C"
                  threshold={38}
                />
              )}

              {(activeTab === 'overview' || activeTab === 'gas') && (
                <SensorChart 
                  title="Gas Levels (MQ-2)"
                  data={gasHistory}
                  color="#ef4444"
                  unit=" PPM"
                  threshold={700}
                />
              )}

              {activeTab === 'motion' && (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Motion Analysis</h3>
                  <p className="text-gray-500 mt-2">
                    Real-time accelerometer data visualization coming soon.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-400">X-Axis</div>
                      <div className="font-mono font-bold">0.02g</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-400">Y-Axis</div>
                      <div className="font-mono font-bold">0.98g</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-400">Z-Axis</div>
                      <div className="font-mono font-bold">0.11g</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
