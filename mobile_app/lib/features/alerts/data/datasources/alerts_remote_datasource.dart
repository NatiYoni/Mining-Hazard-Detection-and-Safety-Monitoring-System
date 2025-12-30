import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../models/alert_model.dart';

abstract class AlertsRemoteDataSource {
  Future<List<AlertModel>> getAlerts();
}

class AlertsRemoteDataSourceImpl implements AlertsRemoteDataSource {
  final ApiClient apiClient;

  AlertsRemoteDataSourceImpl(this.apiClient);

  @override
  Future<List<AlertModel>> getAlerts() async {
    try {
      final response = await apiClient.dio.get('/alerts');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => AlertModel.fromJson(json)).toList();
      } else {
        throw ServerException('Failed to fetch alerts');
      }
    } on DioException catch (e) {
      throw ServerException(e.message ?? 'Server Error');
    }
  }
}
