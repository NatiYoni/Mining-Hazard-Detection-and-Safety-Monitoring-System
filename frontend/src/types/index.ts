export type UserRole = 'Admin' | 'Supervisor' | 'Worker';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  assigned_device_id?: string; // For Supervisors/Workers
}

export interface SensorPayload {
  temp?: number;
  gas?: number;
  fall?: boolean;
  vibration?: number;
  [key: string]: any;
}

export interface SensorReading {
  device_id: string;
  sensor_type: string; // 'telemetry' | 'gas' | 'temperature' | ...
  payload: SensorPayload;
  timestamp: string;
}

export interface DeviceStatus {
  device_id: string;
  is_online: boolean;
  last_seen: string;
  current_readings?: SensorPayload;
  status: 'Safe' | 'Warning' | 'Critical';
}

export interface Alert {
  id: string;
  device_id: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface WebSocketMessage {
  type: 'sensor_update' | 'alert_new' | 'device_status' | 'image_update';
  device_id?: string;
  payload?: any;
  timestamp?: string;
  // For sensor_update specifically
  sensor_type?: string;
}
