"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { SensorData } from '@/types';

interface WebSocketContextType {
  isConnected: boolean;
  lastReading: SensorData | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastReading, setLastReading] = useState<SensorData | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    // Use wss:// for production (https), ws:// for local (http)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Fallback to localhost if API_URL is not set, otherwise parse from env
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mining-hazard-detection-and-safety-monitoring-system.onrender.com/api/v1';
    // Extract host from API URL
    const host = apiUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '');
    
    const wsUrl = `${protocol}//${host}/api/v1/ws`;

    console.log('Connecting to WebSocket:', wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'sensor_update') {
          setLastReading(data);
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      // Try to reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.current?.close();
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastReading }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
