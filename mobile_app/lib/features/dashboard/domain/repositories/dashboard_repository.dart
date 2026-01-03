import '../entities/device.dart';

abstract class DashboardRepository {
  Stream<List<Device>> getDevicesStream();
  Future<List<Device>> getDevices();
  void connectWebSocket();
  void disconnectWebSocket();
  Future<void> toggleBuzzer(String deviceId, bool state);
}
