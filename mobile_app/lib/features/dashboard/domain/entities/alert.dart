import 'package:equatable/equatable.dart';

class Alert extends Equatable {
  final String id;
  final String deviceId;
  final String severity; // 'Critical', 'Warning', 'Info'
  final String message;
  final DateTime timestamp;
  final bool acknowledged;

  const Alert({
    required this.id,
    required this.deviceId,
    required this.severity,
    required this.message,
    required this.timestamp,
    required this.acknowledged,
  });

  @override
  List<Object?> get props => [id, deviceId, severity, message, timestamp, acknowledged];
}
