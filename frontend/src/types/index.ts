export interface SensorData {
  id: string;
  device_id: string;
  sensor_type: string;
  payload: {
    temperature?: number;
    humidity?: number;
    methane_level?: number;
    dust_level?: number;
    [key: string]: any;
  };
  timestamp: string;
}

export interface Device {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  last_seen: string;
}

export interface Alert {
  id: string;
  device_id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}
