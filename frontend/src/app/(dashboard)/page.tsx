"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "@/context/WebSocketContext";
import { RealTimeGauge } from "@/components/dashboard/RealTimeGauge";
import { SensorChart } from "@/components/dashboard/SensorChart";
import { api } from "@/lib/api";
import { SensorData } from "@/types";

export default function DashboardPage() {
  const { lastReading, isConnected } = useWebSocket();
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);

  // Fetch initial history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/sensors/history?limit=20");
        // Reverse to show oldest to newest
        setHistory(response.data.reverse());
        if (response.data.length > 0) {
          setSensorData(response.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchHistory();
  }, []);

  // Update with real-time data
  useEffect(() => {
    if (lastReading) {
      const newData = lastReading as SensorData;
      setSensorData(newData);
      setHistory((prev) => {
        const newHistory = [...prev, newData];
        if (newHistory.length > 20) {
          return newHistory.slice(newHistory.length - 20);
        }
        return newHistory;
      });
    }
  }, [lastReading]);

  if (!sensorData && history.length === 0) {
    return <div className="p-8">Loading...</div>;
  }

  const currentPayload = sensorData?.payload || history[history.length - 1]?.payload || {
    temperature: 0,
    humidity: 0,
    methane_level: 0,
    dust_level: 0,
  };

  const chartData = history.map(item => ({
    timestamp: item.timestamp,
    temperature: item.payload.temperature || 0,
    humidity: item.payload.humidity || 0,
    methane_level: item.payload.methane_level || 0,
    dust_level: item.payload.dust_level || 0,
  }));

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RealTimeGauge
          type="temperature"
          value={currentPayload.temperature || 0}
          unit="°C"
          status={(currentPayload.temperature || 0) > 40 ? "critical" : (currentPayload.temperature || 0) > 30 ? "warning" : "normal"}
        />
        <RealTimeGauge
          type="humidity"
          value={currentPayload.humidity || 0}
          unit="%"
          status={(currentPayload.humidity || 0) > 80 ? "warning" : "normal"}
        />
        <RealTimeGauge
          type="methane_level"
          value={currentPayload.methane_level || 0}
          unit="ppm"
          status={(currentPayload.methane_level || 0) > 50 ? "critical" : (currentPayload.methane_level || 0) > 20 ? "warning" : "normal"}
        />
        <RealTimeGauge
          type="dust_level"
          value={currentPayload.dust_level || 0}
          unit="mg/m³"
          status={(currentPayload.dust_level || 0) > 10 ? "critical" : (currentPayload.dust_level || 0) > 5 ? "warning" : "normal"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <SensorChart
            title="Temperature History"
            data={chartData}
            dataKey="temperature"
            color="#8884d8"
          />
        </div>
        <div className="col-span-3">
           <SensorChart
            title="Methane Levels"
            data={chartData}
            dataKey="methane_level"
            color="#ff7300"
          />
        </div>
      </div>
    </div>
  );
}
