import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

class ApiClient {
  final Dio _dio;
  final SharedPreferences _sharedPreferences;

  ApiClient(this._sharedPreferences)
      : _dio = Dio(
          BaseOptions(
            baseUrl: ApiConstants.baseUrl,
            headers: {
              'Content-Type': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _sharedPreferences.getString('token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // Handle 401 Unauthorized
          if (e.response?.statusCode == 401) {
            // Clear token and navigate to login (handled by UI/Bloc usually)
            _sharedPreferences.remove('token');
            _sharedPreferences.remove('user');
          }
          return handler.next(e);
        },
      ),
    );
  }

  Dio get dio => _dio;
}
