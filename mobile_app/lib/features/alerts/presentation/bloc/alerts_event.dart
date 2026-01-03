import 'package:equatable/equatable.dart';

abstract class AlertsEvent extends Equatable {
  const AlertsEvent();
  @override
  List<Object> get props => [];
}

class FetchAlerts extends AlertsEvent {}
