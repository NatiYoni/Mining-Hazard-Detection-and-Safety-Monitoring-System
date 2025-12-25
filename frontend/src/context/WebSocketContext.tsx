'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { WebSocketMessage, DeviceStatus, Alert, SensorPayload } from '../types';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  devices: Map<string, DeviceStatus>;
  alerts: Alert[];
  sendMessage: (msg: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [devices, setDevices] = useState<Map<string, DeviceStatus>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    // In production, use env var. For now, hardcode localhost.
    const wsUrl = 'ws://localhost:8080/api/v1/ws'; 
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      // Try reconnect in 3 seconds
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.current?.close();
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        handleMessage(message);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };
  };

  const handleMessage = (msg: WebSocketMessage) => {
    if (msg.type === 'sensor_update' && msg.device_id) {
      setDevices((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(msg.device_id!) || {
          device_id: msg.device_id!,
          is_online: true,
          last_seen: new Date().toISOString(),
          status: 'Safe',
          current_readings: {}
        };

        // Update readings
        const payload = msg.payload as SensorPayload;
        current.current_readings = { ...current.current_readings, ...payload };
        current.last_seen = msg.timestamp || new Date().toISOString();
        current.is_online = true;

        // Simple frontend status logic (can be overridden by backend alerts)
        if (payload.fall) current.status = 'Critical';
        else if ((payload.gas || 0) > 700) current.status = 'Critical';
        else if ((payload.temp || 0) > 38) current.status = 'Critical';
        else if ((payload.temp || 0) > 31) current.status = 'Warning';
        else current.status = 'Safe';

        newMap.set(msg.device_id!, current);
        return newMap;
      });
    }
  };

  const sendMessage = (msg: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  };

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, devices, alerts, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
