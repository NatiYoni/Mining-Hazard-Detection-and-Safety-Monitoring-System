import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import 'package:mobile_app/features/dashboard/domain/entities/alert.dart';

abstract class AlertsRepository {
  Future<Either<Failure, List<Alert>>> getAlerts();
}
