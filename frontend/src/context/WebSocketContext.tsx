'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { WebSocketMessage, DeviceStatus, Alert, SensorPayload } from '../types';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  devices: Map<string, DeviceStatus>;
  alerts: Alert[];
  latestImages: Map<string, string>; // Map<deviceId, imageUrl>
  sendMessage: (msg: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [devices, setDevices] = useState<Map<string, DeviceStatus>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [latestImages, setLatestImages] = useState<Map<string, string>>(new Map());
  const { user, isLoading } = useAuth();
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    // Determine WS URL based on environment or fallback
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mining-hazard-detection-and-safety.onrender.com/api/v1';
    // Convert http/https to ws/wss
    const wsBase = apiUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBase.replace('/api/v1', '')}/api/v1/ws`;
    
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
    if (msg.type === 'image_update' && msg.payload) {
      const payload = msg.payload as any; // Assuming payload has device_id and image_url
      if (payload.device_id && payload.image_url) {
        setLatestImages(prev => {
          const newMap = new Map(prev);
          newMap.set(payload.device_id, payload.image_url);
          return newMap;
        });
      }
    } else if (msg.type === 'sensor_update' && msg.device_id) {
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
    if (isLoading || !user) return;

    connect();

    // Fetch initial devices
    const fetchDevices = async () => {
      try {
        const res = await api.get('/devices');
        if (Array.isArray(res.data)) {
          setDevices(prev => {
            const newMap = new Map(prev);
            res.data.forEach((d: any) => {
              // Merge with existing or add new
              if (!newMap.has(d.id)) {
                newMap.set(d.id, {
                  device_id: d.id,
                  status: 'Safe', // Default, will be updated by WS
                  is_online: false, // Assume offline until WS update
                  last_seen: d.created_at || new Date().toISOString(),
                  current_readings: {}
                });
              }
            });
            return newMap;
          });
        }
      } catch (err) {
        console.error('Failed to fetch initial devices:', err);
      }
    };
    fetchDevices();

    // Heartbeat check for offline devices
    const heartbeatInterval = setInterval(() => {
      setDevices((prev) => {
        const newMap = new Map(prev);
        let hasChanges = false;
        const now = new Date().getTime();

        newMap.forEach((device, id) => {
          if (device.is_online && device.last_seen) {
            const lastSeenTime = new Date(device.last_seen).getTime();
            // If no data for 10 seconds, mark as offline
            if (now - lastSeenTime > 10000) {
              newMap.set(id, { ...device, is_online: false });
              hasChanges = true;
            }
          }
        });

        return hasChanges ? newMap : prev;
      });
    }, 5000); // Check every 5 seconds

    return () => {
      ws.current?.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      clearInterval(heartbeatInterval);
    };
  }, [user, isLoading]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, devices, alerts, latestImages, sendMessage }}>
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
