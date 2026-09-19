import 'package:flutter_test/flutter_test.dart';
import 'package:nearme/features/interests/domain/interest.dart';
import 'package:nearme/features/interests/domain/interest_repository.dart';
import 'package:nearme/features/interests/presentation/interest_selection_controller.dart';

void main() {
  group('InterestSelectionController', () {
    test('loads available and selected interests', () async {
      final repository = _FakeInterestRepository(selectedIds: <int>{2});
      final controller = InterestSelectionController(repository);

      await controller.load();

      expect(controller.interests, hasLength(2));
      expect(controller.selectedIds, <int>{2});
      expect(controller.errorMessage, isNull);
    });

    test('toggles and saves selected interests', () async {
      final repository = _FakeInterestRepository(selectedIds: <int>{1});
      final controller = InterestSelectionController(repository);
      await controller.load();

      controller
        ..toggle(1)
        ..toggle(2);
      final saved = await controller.save();

      expect(saved, isTrue);
      expect(repository.savedIds, <int>{2});
    });

    test('exposes repository failures', () async {
      final repository = _FakeInterestRepository(
        selectedIds: <int>{},
        failure: const InterestFailure('Request failed.'),
      );
      final controller = InterestSelectionController(repository);

      await controller.load();

      expect(controller.errorMessage, 'Request failed.');
      expect(controller.isLoading, isFalse);
    });
  });
}

final class _FakeInterestRepository implements InterestRepository {
  _FakeInterestRepository({required this.selectedIds, this.failure});

  final Set<int> selectedIds;
  final InterestFailure? failure;
  Set<int>? savedIds;

  static const interests = <Interest>[
    Interest(id: 1, slug: 'culture', name: 'Culture', iconName: 'museum'),
    Interest(id: 2, slug: 'food', name: 'Food', iconName: 'local_dining'),
  ];

  @override
  Future<List<Interest>> getAvailableInterests() async {
    if (failure case final error?) {
      throw error;
    }
    return interests;
  }

  @override
  Future<Set<int>> getSelectedInterestIds() async {
    if (failure case final error?) {
      throw error;
    }
    return Set<int>.from(selectedIds);
  }

  @override
  Future<void> replaceSelectedInterests(Set<int> interestIds) async {
    if (failure case final error?) {
      throw error;
    }
    savedIds = Set<int>.from(interestIds);
  }
}
