'use client';

import React, { useEffect, useState } from 'react';
import { VideoOff, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/context/WebSocketContext';

interface VideoPlayerProps {
  deviceId?: string;
  fallbackUrl?: string;
}

export const VideoPlayer = ({ deviceId }: VideoPlayerProps) => {
  const { latestImages } = useWebSocket();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initial fetch
  useEffect(() => {
    if (!deviceId) return;

    const fetchLatestImage = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/images/latest?device_id=${deviceId}`);
        if (res.data && res.data.image_url) {
          setImageUrl(res.data.image_url);
          setLastUpdated(new Date(res.data.created_at));
        }
      } catch (err) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchLatestImage();
  }, [deviceId]);

  // Listen for WebSocket updates
  useEffect(() => {
    if (deviceId && latestImages.has(deviceId)) {
      setImageUrl(latestImages.get(deviceId)!);
      setLastUpdated(new Date());
    }
  }, [deviceId, latestImages]);

  if (!deviceId) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground">
        <VideoOff className="h-12 w-12 mb-2 opacity-50" />
        <p>Select a device to view stream</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Live Feed" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
          ) : (
            <VideoOff className="h-12 w-12 mb-2 opacity-50" />
          )}
          <p>{loading ? 'Connecting...' : 'No signal'}</p>
        </div>
      )}

      {/* Overlay Info */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${imageUrl ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        {imageUrl ? 'LIVE' : 'OFFLINE'}
      </div>

      {lastUpdated && (
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs text-white/80">
          Last update: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
