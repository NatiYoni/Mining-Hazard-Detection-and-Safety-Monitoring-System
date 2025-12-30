import 'package:mobile_app/features/dashboard/domain/entities/alert.dart';

class AlertModel extends Alert {
  const AlertModel({
    required super.id,
    required super.deviceId,
    required super.severity,
    required super.message,
    required super.timestamp,
    required super.acknowledged,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    return AlertModel(
      id: json['id'] ?? '',
      deviceId: json['device_id'] ?? '',
      severity: json['severity'] ?? 'Info',
      message: json['message'] ?? '',
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      acknowledged: json['acknowledged'] ?? false,
    );
  }
}
