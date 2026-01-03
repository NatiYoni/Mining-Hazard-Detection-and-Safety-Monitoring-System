import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/network/api_client.dart';
import 'features/auth/data/datasources/auth_local_datasource.dart';
import 'features/auth/data/datasources/auth_remote_datasource.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/domain/usecases/login_usecase.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';

import 'features/dashboard/data/datasources/websocket_datasource.dart';
import 'features/dashboard/data/datasources/dashboard_remote_datasource.dart';
import 'features/dashboard/data/repositories/dashboard_repository_impl.dart';
import 'features/dashboard/domain/repositories/dashboard_repository.dart';
import 'features/dashboard/domain/usecases/toggle_buzzer_usecase.dart';
import 'features/dashboard/presentation/bloc/dashboard_bloc.dart';

import 'features/alerts/data/datasources/alerts_remote_datasource.dart';
import 'features/alerts/data/repositories/alerts_repository_impl.dart';
import 'features/alerts/domain/repositories/alerts_repository.dart';
import 'features/alerts/domain/usecases/get_alerts_usecase.dart';
import 'features/alerts/presentation/bloc/alerts_bloc.dart';

final sl = GetIt.instance;

Future<void> init() async {
  //! Features - Alerts
  sl.registerFactory(() => AlertsBloc(sl()));
  sl.registerLazySingleton(() => GetAlertsUseCase(sl()));
  sl.registerLazySingleton<AlertsRepository>(
    () => AlertsRepositoryImpl(sl()),
  );
  sl.registerLazySingleton<AlertsRemoteDataSource>(
    () => AlertsRemoteDataSourceImpl(sl()),
  );

  //! Features - Dashboard
  sl.registerFactory(() => DashboardBloc(sl(), sl()));
  sl.registerLazySingleton(() => ToggleBuzzerUseCase(sl()));
  sl.registerLazySingleton<DashboardRepository>(
    () => DashboardRepositoryImpl(sl(), sl()),
  );
  sl.registerLazySingleton(() => WebSocketDataSource(sl()));
  sl.registerLazySingleton<DashboardRemoteDataSource>(
    () => DashboardRemoteDataSourceImpl(sl()),
  );

  //! Features - Auth
  // Bloc
  sl.registerFactory(
    () => AuthBloc(
      loginUseCase: sl(),
      authRepository: sl(),
    ),
  );

  // Use cases
  sl.registerLazySingleton(() => LoginUseCase(sl()));

  // Repository
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDataSource: sl(),
      localDataSource: sl(),
    ),
  );

  // Data sources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(sl()),
  );
  sl.registerLazySingleton<AuthLocalDataSource>(
    () => AuthLocalDataSourceImpl(sl()),
  );

  //! Core
  sl.registerLazySingleton(() => ApiClient(sl()));

  //! External
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton(() => sharedPreferences);
}
