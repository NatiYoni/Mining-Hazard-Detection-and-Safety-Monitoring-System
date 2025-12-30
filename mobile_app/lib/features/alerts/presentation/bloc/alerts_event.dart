import 'package:equatable/equatable.dart';
import 'package:mobile_app/features/dashboard/domain/entities/alert.dart';

abstract class AlertsEvent extends Equatable {
  const AlertsEvent();
  @override
  List<Object> get props => [];
}

class FetchAlerts extends AlertsEvent {}
