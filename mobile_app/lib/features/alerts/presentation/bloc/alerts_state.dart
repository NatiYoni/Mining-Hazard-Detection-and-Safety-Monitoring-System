import 'package:equatable/equatable.dart';
import 'package:mobile_app/features/dashboard/domain/entities/alert.dart';

abstract class AlertsState extends Equatable {
  const AlertsState();
  @override
  List<Object> get props => [];
}

class AlertsInitial extends AlertsState {}
class AlertsLoading extends AlertsState {}
class AlertsLoaded extends AlertsState {
  final List<Alert> alerts;
  const AlertsLoaded(this.alerts);
  @override
  List<Object> get props => [alerts];
}
class AlertsError extends AlertsState {
  final String message;
  const AlertsError(this.message);
  @override
  List<Object> get props => [message];
}
