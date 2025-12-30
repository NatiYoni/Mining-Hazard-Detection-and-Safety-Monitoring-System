import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/error/exceptions.dart';
import '../models/user_model.dart';

abstract class AuthLocalDataSource {
  Future<void> cacheUser(UserModel user);
  Future<void> cacheToken(String token);
  Future<UserModel> getLastUser();
  Future<String> getToken();
  Future<void> clearCache();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final SharedPreferences sharedPreferences;

  AuthLocalDataSourceImpl(this.sharedPreferences);

  @override
  Future<void> cacheUser(UserModel user) {
    return sharedPreferences.setString('user', json.encode(user.toJson()));
  }

  @override
  Future<void> cacheToken(String token) {
    return sharedPreferences.setString('token', token);
  }

  @override
  Future<UserModel> getLastUser() {
    final jsonString = sharedPreferences.getString('user');
    if (jsonString != null) {
      return Future.value(UserModel.fromJson(json.decode(jsonString)));
    } else {
      throw CacheException('No cached user');
    }
  }

  @override
  Future<String> getToken() {
    final token = sharedPreferences.getString('token');
    if (token != null) {
      return Future.value(token);
    } else {
      throw CacheException('No cached token');
    }
  }

  @override
  Future<void> clearCache() async {
    await sharedPreferences.remove('user');
    await sharedPreferences.remove('token');
  }
}
