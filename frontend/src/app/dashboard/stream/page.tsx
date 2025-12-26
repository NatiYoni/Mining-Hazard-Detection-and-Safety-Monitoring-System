'use client';

import React, { useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { VideoPlayer } from '@/components/device/VideoPlayer';

export default function StreamPage() {
  const { devices } = useWebSocket();
  const deviceList = Array.from(devices.values());
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(deviceList[0]?.device_id || '');

  const selectedDevice = devices.get(selectedDeviceId);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Live Video Stream</h1>
      
      {/* Device Selector */}
      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Device</label>
        <select 
          className="w-full p-2 border rounded-md bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
        >
          <option value="">Select a device...</option>
          {deviceList.map(d => (
            <option key={d.device_id} value={d.device_id}>
              {d.device_id} ({d.status})
            </option>
          ))}
        </select>
      </div>

      {/* Video Player */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Live Feed</h2>
          {selectedDeviceId ? (
             // Using a placeholder IP since it's not in the device object yet
             <VideoPlayer deviceIp="192.168.4.1" /> 
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              Select a device to view stream
            </div>
          )}
        </div>
        
        {/* Device Info */}
        {selectedDevice && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h2 className="text-lg font-semibold mb-4">Device Status</h2>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Device ID</p>
                        <p className="font-medium">{selectedDevice.device_id}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedDevice.status === 'Safe' ? 'bg-green-100 text-green-800' :
                            selectedDevice.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {selectedDevice.status}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Last Seen</p>
                        <p className="font-medium">{new Date(selectedDevice.last_seen).toLocaleTimeString()}</p>
                    </div>
                </div>
                
                {selectedDevice.current_readings && (
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Current Readings</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(selectedDevice.current_readings).map(([key, value]) => (
                                <div key={key}>
                                    <p className="text-sm text-gray-500 capitalize">{key}</p>
                                    <p className="font-medium">{String(value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
