import '../entities/device.dart';

abstract class DashboardRepository {
  Stream<List<Device>> getDevicesStream();
  void connectWebSocket();
  void disconnectWebSocket();
}
