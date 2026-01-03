import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/dashboard_repository.dart';

class ToggleBuzzerUseCase implements UseCase<void, ToggleBuzzerParams> {
  final DashboardRepository repository;

  ToggleBuzzerUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(ToggleBuzzerParams params) async {
    try {
      await repository.toggleBuzzer(params.deviceId, params.state);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}

class ToggleBuzzerParams {
  final String deviceId;
  final bool state;

  ToggleBuzzerParams({required this.deviceId, required this.state});
}
