import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import 'package:mobile_app/features/dashboard/domain/entities/alert.dart';
import '../repositories/alerts_repository.dart';

class GetAlertsUseCase implements UseCase<List<Alert>, NoParams> {
  final AlertsRepository repository;

  GetAlertsUseCase(this.repository);

  @override
  Future<Either<Failure, List<Alert>>> call(NoParams params) async {
    return await repository.getAlerts();
  }
}
