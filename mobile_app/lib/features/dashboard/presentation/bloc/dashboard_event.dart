import 'package:equatable/equatable.dart';
import '../../domain/entities/device.dart';

abstract class DashboardEvent extends Equatable {
  const DashboardEvent();

  @override
  List<Object> get props => [];
}

class DashboardStarted extends DashboardEvent {}
class DashboardStopped extends DashboardEvent {}
class DevicesUpdated extends DashboardEvent {
  final List<Device> devices;
  const DevicesUpdated(this.devices);
  @override
  List<Object> get props => [devices];
}
