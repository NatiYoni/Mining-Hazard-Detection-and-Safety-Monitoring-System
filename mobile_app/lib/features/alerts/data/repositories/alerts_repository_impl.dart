import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import 'package:mobile_app/features/dashboard/domain/entities/alert.dart';
import '../../domain/repositories/alerts_repository.dart';
import '../datasources/alerts_remote_datasource.dart';

class AlertsRepositoryImpl implements AlertsRepository {
  final AlertsRemoteDataSource remoteDataSource;

  AlertsRepositoryImpl(this.remoteDataSource);

  @override
  Future<Either<Failure, List<Alert>>> getAlerts() async {
    try {
      final alerts = await remoteDataSource.getAlerts();
      return Right(alerts);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }
}
