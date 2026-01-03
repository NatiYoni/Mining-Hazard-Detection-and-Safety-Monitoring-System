import 'dart:async';
import '../../domain/entities/device.dart';
import '../../domain/repositories/dashboard_repository.dart';
import '../datasources/websocket_datasource.dart';
import '../datasources/dashboard_remote_datasource.dart';
import '../models/device_model.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  final WebSocketDataSource dataSource;
  final DashboardRemoteDataSource remoteDataSource;
  final _devicesController = StreamController<List<Device>>.broadcast();
  final Map<String, DeviceModel> _devicesMap = {};

  DashboardRepositoryImpl(this.dataSource, this.remoteDataSource) {
    dataSource.messageStream.listen(_handleMessage);
  }

  @override
  Stream<List<Device>> getDevicesStream() {
    return _devicesController.stream;
  }

  @override
  Future<List<Device>> getDevices() async {
    try {
      final devices = await remoteDataSource.getDevices();
      for (var device in devices) {
        _devicesMap[device.id] = device;
      }
      _devicesController.add(_devicesMap.values.toList());
      return _devicesMap.values.toList();
    } catch (e) {
      // If fetch fails, we might still have data from WS or cache
      return _devicesMap.values.toList();
    }
  }

  @override
  void connectWebSocket() {
    dataSource.connect();
  }

  @override
  void disconnectWebSocket() {
    dataSource.disconnect();
  }

  @override
  Future<void> toggleBuzzer(String deviceId, bool state) async {
    await remoteDataSource.toggleBuzzer(deviceId, state);
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
        else if ((sensorPayload.temp ?? 0) > 25) status = 'Critical';
        else if ((sensorPayload.temp ?? 0) > 24) status = 'Warning';

        final updated = current.copyWith(
          isOnline: true,
          lastSeen: timestamp != null ? DateTime.tryParse(timestamp) : DateTime.now(),
          currentReadings: sensorPayload,
          status: status,
        );

        _devicesMap[deviceId] = updated;
        _devicesController.add(_devicesMap.values.toList());
      }
    } else if (type == 'image_update') {
      final payload = message['payload'];
      if (payload != null) {
        final deviceId = payload['device_id'];
        final imageUrl = payload['image_url'];
        
        if (deviceId != null && imageUrl != null) {
          DeviceModel current = _devicesMap[deviceId] ??
              DeviceModel(
                id: deviceId,
                isOnline: true,
                lastSeen: DateTime.now(),
                status: 'Safe',
              );
              
          final updated = current.copyWith(
            latestImageUrl: imageUrl,
            lastSeen: DateTime.now(),
          );
          
          _devicesMap[deviceId] = updated;
          _devicesController.add(_devicesMap.values.toList());
        }
      }
    } else if (type == 'device_status') {
       // Handle explicit status updates if any
    }
  }
}
