import 'package:equatable/equatable.dart';
import '../../domain/entities/device.dart';

abstract class DashboardState extends Equatable {
  const DashboardState();
  
  @override
  List<Object> get props => [];
}

class DashboardInitial extends DashboardState {}

class DashboardLoaded extends DashboardState {
  final List<Device> devices;
  final int totalDevices;
  final int onlineDevices;
  final int criticalAlerts;
  final int warnings;
  final String avgTemp;

  const DashboardLoaded({
    required this.devices,
    required this.totalDevices,
    required this.onlineDevices,
    required this.criticalAlerts,
    required this.warnings,
    required this.avgTemp,
  });

  @override
  List<Object> get props => [devices, totalDevices, onlineDevices, criticalAlerts, warnings, avgTemp];
}
