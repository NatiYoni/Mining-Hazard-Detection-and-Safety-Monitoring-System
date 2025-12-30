import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/device.dart';
import '../../domain/repositories/dashboard_repository.dart';
import 'dashboard_event.dart';
import 'dashboard_state.dart';

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  final DashboardRepository repository;
  StreamSubscription? _devicesSubscription;

  DashboardBloc(this.repository) : super(DashboardInitial()) {
    on<DashboardStarted>(_onStarted);
    on<DashboardStopped>(_onStopped);
    on<DevicesUpdated>(_onDevicesUpdated);
  }

  void _onStarted(DashboardStarted event, Emitter<DashboardState> emit) {
    repository.connectWebSocket();
    _devicesSubscription?.cancel();
    _devicesSubscription = repository.getDevicesStream().listen(
      (devices) => add(DevicesUpdated(devices)),
    );
  }

  void _onStopped(DashboardStopped event, Emitter<DashboardState> emit) {
    _devicesSubscription?.cancel();
    repository.disconnectWebSocket();
  }

  void _onDevicesUpdated(DevicesUpdated event, Emitter<DashboardState> emit) {
    final devices = event.devices;
    final onlineDevices = devices.where((d) => d.isOnline).toList();
    
    final critical = onlineDevices.where((d) => d.status == 'Critical').length;
    final warning = onlineDevices.where((d) => d.status == 'Warning').length;
    
    final temps = onlineDevices
        .map((d) => d.currentReadings?.temp)
        .where((t) => t != null)
        .cast<double>()
        .toList();
        
    final avgTemp = temps.isNotEmpty
        ? (temps.reduce((a, b) => a + b) / temps.length).toStringAsFixed(1)
        : '--';

    emit(DashboardLoaded(
      devices: devices,
      totalDevices: devices.length,
      onlineDevices: onlineDevices.length,
      criticalAlerts: critical,
      warnings: warning,
      avgTemp: avgTemp,
    ));
  }

  @override
  Future<void> close() {
    _devicesSubscription?.cancel();
    repository.disconnectWebSocket();
    return super.close();
  }
}
