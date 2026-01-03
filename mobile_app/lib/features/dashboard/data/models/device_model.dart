import '../../domain/entities/device.dart';

class SensorPayloadModel extends SensorPayload {
  const SensorPayloadModel({
    super.temp,
    super.gas,
    super.fall,
    super.vibration,
  });

  factory SensorPayloadModel.fromJson(Map<String, dynamic> json) {
    return SensorPayloadModel(
      temp: (json['temp'] as num?)?.toDouble(),
      gas: (json['gas'] as num?)?.toDouble(),
      fall: json['fall'] as bool?,
      vibration: (json['vibration'] as num?)?.toDouble(),
    );
  }
}

class DeviceModel extends Device {
  const DeviceModel({
    required super.id,
    required super.isOnline,
    required super.lastSeen,
    super.currentReadings,
    required super.status,
    super.latestImageUrl,
  });

  factory DeviceModel.fromJson(Map<String, dynamic> json) {
    // Handle both REST API (id) and WebSocket (device_id) formats
    final id = json['id'] ?? json['device_id'] ?? '';
    
    var lastSeen = DateTime.tryParse(json['last_seen'] ?? json['updated_at'] ?? '') ?? DateTime.now();
    if (lastSeen.isUtc) {
      lastSeen = lastSeen.toLocal();
    }

    // Determine online status:
    // 1. Use explicit 'is_online' if available
    // 2. Otherwise, check if lastSeen is within 5 minutes
    final bool isOnline = json['is_online'] ?? 
        (DateTime.now().difference(lastSeen).inMinutes < 5);
    
    return DeviceModel(
      id: id,
      isOnline: isOnline,
      lastSeen: lastSeen,
      currentReadings: json['current_readings'] != null
          ? SensorPayloadModel.fromJson(json['current_readings'])
          : null,
      status: json['status'] ?? 'Safe',
      latestImageUrl: json['latest_image_url'],
    );
  }

  DeviceModel copyWith({
    String? id,
    bool? isOnline,
    DateTime? lastSeen,
    SensorPayload? currentReadings,
    String? status,
    String? latestImageUrl,
  }) {
    return DeviceModel(
      id: id ?? this.id,
      isOnline: isOnline ?? this.isOnline,
      lastSeen: lastSeen ?? this.lastSeen,
      currentReadings: currentReadings ?? this.currentReadings,
      status: status ?? this.status,
      latestImageUrl: latestImageUrl ?? this.latestImageUrl,
    );
  }
}
