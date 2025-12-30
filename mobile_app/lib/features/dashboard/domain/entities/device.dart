import 'package:equatable/equatable.dart';

class SensorPayload extends Equatable {
  final double? temp;
  final double? gas;
  final bool? fall;
  final double? vibration;

  const SensorPayload({
    this.temp,
    this.gas,
    this.fall,
    this.vibration,
  });

  @override
  List<Object?> get props => [temp, gas, fall, vibration];
}

class Device extends Equatable {
  final String id;
  final bool isOnline;
  final DateTime lastSeen;
  final SensorPayload? currentReadings;
  final String status; // 'Safe', 'Warning', 'Critical'

  const Device({
    required this.id,
    required this.isOnline,
    required this.lastSeen,
    this.currentReadings,
    required this.status,
  });

  @override
  List<Object?> get props => [id, isOnline, lastSeen, currentReadings, status];
}
