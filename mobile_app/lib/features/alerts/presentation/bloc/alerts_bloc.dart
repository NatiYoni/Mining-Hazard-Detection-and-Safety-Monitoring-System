import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/usecases/get_alerts_usecase.dart';
import 'alerts_event.dart';
import 'alerts_state.dart';

class AlertsBloc extends Bloc<AlertsEvent, AlertsState> {
  final GetAlertsUseCase getAlertsUseCase;

  AlertsBloc(this.getAlertsUseCase) : super(AlertsInitial()) {
    on<FetchAlerts>(_onFetchAlerts);
  }

  Future<void> _onFetchAlerts(FetchAlerts event, Emitter<AlertsState> emit) async {
    emit(AlertsLoading());
    final result = await getAlertsUseCase(NoParams());
    result.fold(
      (failure) => emit(AlertsError(failure.message)),
      (alerts) => emit(AlertsLoaded(alerts)),
    );
  }
}
