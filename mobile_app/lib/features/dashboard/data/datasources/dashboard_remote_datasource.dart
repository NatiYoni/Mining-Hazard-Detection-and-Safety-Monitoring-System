import '../../../../core/network/api_client.dart';
import '../models/device_model.dart';

abstract class DashboardRemoteDataSource {
  Future<List<DeviceModel>> getDevices();
  Future<void> toggleBuzzer(String deviceId, bool state);
}

class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  final ApiClient apiClient;

  DashboardRemoteDataSourceImpl(this.apiClient);

  @override
  Future<List<DeviceModel>> getDevices() async {
    try {
      final response = await apiClient.dio.get('/devices');
      final List<dynamic> data = response.data;
      return data.map((json) => DeviceModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch devices: $e');
    }
  }

  @override
  Future<void> toggleBuzzer(String deviceId, bool state) async {
    try {
      await apiClient.dio.post(
        '/devices/$deviceId/command',
        data: {'command': state ? 'ON' : 'OFF'},
      );
    } catch (e) {
      throw Exception('Failed to toggle buzzer');
    }
  }
}
