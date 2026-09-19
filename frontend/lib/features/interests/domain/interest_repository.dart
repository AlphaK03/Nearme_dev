import 'package:nearme/features/interests/domain/interest.dart';

final class InterestFailure implements Exception {
  const InterestFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

abstract interface class InterestRepository {
  Future<List<Interest>> getAvailableInterests();

  Future<Set<int>> getSelectedInterestIds();

  Future<void> replaceSelectedInterests(Set<int> interestIds);
}
