'use client';

import React, { useEffect, useRef, useState } from 'react';
import { VideoOff, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  deviceIp?: string; // In a real app, we'd get this from the backend
  fallbackUrl?: string;
}

export const VideoPlayer = ({ deviceIp }: VideoPlayerProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // If no IP provided, we can't connect
    if (!deviceIp) return;

    // Connect to ESP32-CAM WebSocket
    // Assuming the device is reachable at ws://<IP>:81/stream
    const wsUrl = `ws://${deviceIp}:81/stream`;
    
    console.log('Connecting to video stream:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = 'blob';

      ws.onopen = () => {
        setIsConnected(true);
        setError(false);
      };

      ws.onmessage = (event) => {
        if (imgRef.current) {
          const url = URL.createObjectURL(event.data);
          imgRef.current.src = url;
          
          // Clean up old object URL to prevent memory leaks
          imgRef.current.onload = () => {
            URL.revokeObjectURL(url);
          };
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setError(true);
        setIsConnected(false);
      };

      return () => {
        ws.close();
      };
    } catch (e) {
      setError(true);
    }
  }, [deviceIp]);

  if (!deviceIp) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center text-gray-500">
        <VideoOff className="h-12 w-12 mb-2" />
        <p>No Video Source</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-border">
      {/* Status Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-red-600 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-xs font-mono text-white bg-black/50 px-2 py-1 rounded">
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Video Feed */}
      <img 
        ref={imgRef} 
        alt="Live Stream" 
        className="w-full h-full object-contain"
      />

      {/* Loading / Error States */}
      {!isConnected && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 text-white">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Connecting to Camera...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-400">
          <VideoOff className="h-10 w-10 mb-2" />
          <p>Connection Failed</p>
          <p className="text-xs mt-1">Check if camera is online</p>
        </div>
      )}
    </div>
  );
};
