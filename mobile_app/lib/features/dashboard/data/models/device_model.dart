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
  });

  factory DeviceModel.fromJson(Map<String, dynamic> json) {
    return DeviceModel(
      id: json['device_id'] ?? '',
      isOnline: json['is_online'] ?? false,
      lastSeen: DateTime.tryParse(json['last_seen'] ?? '') ?? DateTime.now(),
      currentReadings: json['current_readings'] != null
          ? SensorPayloadModel.fromJson(json['current_readings'])
          : null,
      status: json['status'] ?? 'Safe',
    );
  }

  DeviceModel copyWith({
    String? id,
    bool? isOnline,
    DateTime? lastSeen,
    SensorPayload? currentReadings,
    String? status,
  }) {
    return DeviceModel(
      id: id ?? this.id,
      isOnline: isOnline ?? this.isOnline,
      lastSeen: lastSeen ?? this.lastSeen,
      currentReadings: currentReadings ?? this.currentReadings,
      status: status ?? this.status,
    );
  }
}
