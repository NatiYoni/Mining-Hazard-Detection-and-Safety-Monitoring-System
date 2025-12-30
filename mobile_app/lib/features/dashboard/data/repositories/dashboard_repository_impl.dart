import 'dart:async';
import '../../domain/entities/device.dart';
import '../../domain/repositories/dashboard_repository.dart';
import '../datasources/websocket_datasource.dart';
import '../models/device_model.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  final WebSocketDataSource dataSource;
  final _devicesController = StreamController<List<Device>>.broadcast();
  final Map<String, DeviceModel> _devicesMap = {};

  DashboardRepositoryImpl(this.dataSource) {
    dataSource.messageStream.listen(_handleMessage);
  }

  @override
  Stream<List<Device>> getDevicesStream() {
    return _devicesController.stream;
  }

  @override
  void connectWebSocket() {
    dataSource.connect();
  }

  @override
  void disconnectWebSocket() {
    dataSource.disconnect();
  }

  void _handleMessage(Map<String, dynamic> message) {
    final type = message['type'];
    
    if (type == 'sensor_update') {
      final deviceId = message['device_id'];
      if (deviceId != null) {
        final payload = message['payload'];
        final timestamp = message['timestamp'];

        DeviceModel current = _devicesMap[deviceId] ??
            DeviceModel(
              id: deviceId,
              isOnline: true,
              lastSeen: DateTime.now(),
              status: 'Safe',
            );

        // Update logic similar to frontend
        final sensorPayload = SensorPayloadModel.fromJson(payload ?? {});
        
        String status = 'Safe';
        if (sensorPayload.fall == true) status = 'Critical';
        else if ((sensorPayload.gas ?? 0) > 700) status = 'Critical';
        else if ((sensorPayload.temp ?? 0) > 38) status = 'Critical';
        else if ((sensorPayload.temp ?? 0) > 31) status = 'Warning';

        final updated = current.copyWith(
          isOnline: true,
          lastSeen: timestamp != null ? DateTime.tryParse(timestamp) : DateTime.now(),
          currentReadings: sensorPayload,
          status: status,
        );

        _devicesMap[deviceId] = updated;
        _devicesController.add(_devicesMap.values.toList());
      }
    } else if (type == 'device_status') {
       // Handle explicit status updates if any
    }
  }
}
