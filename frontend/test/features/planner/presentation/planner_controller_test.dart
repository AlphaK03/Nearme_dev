import 'package:flutter_test/flutter_test.dart';
import 'package:nearme/features/planner/domain/planner_models.dart';
import 'package:nearme/features/planner/presentation/planner_controller.dart';

void main() {
  group('PlannerController', () {
    test('starts with a demonstrable personalized plan', () {
      final controller = PlannerController();

      expect(controller.stage, PlannerStage.home);
      expect(controller.selectedInterestIds, hasLength(3));
      expect(controller.selectedPlaceIds, hasLength(3));
      expect(controller.canContinueFromInterests, isTrue);
      expect(controller.canCreateRoute, isTrue);
    });

    test('requires at least two interests to continue', () {
      final controller = PlannerController();

      controller
        ..toggleInterest('food')
        ..toggleInterest('nature');

      expect(controller.selectedInterestIds, <String>{'culture'});
      expect(controller.canContinueFromInterests, isFalse);
    });

    test('filters places by category', () {
      final controller = PlannerController()..setPlaceFilter('Gastronomía');

      expect(controller.filteredPlaces, hasLength(2));
      expect(
        controller.filteredPlaces.every(
          (place) => place.category == 'Gastronomía',
        ),
        isTrue,
      );
    });

    test('calculates route totals from selected places', () {
      final controller = PlannerController();

      expect(controller.routeMinutes, 145);
      expect(controller.routeDistance, closeTo(2.6, 0.001));

      controller.togglePlace('park');

      expect(controller.routeMinutes, 85);
      expect(controller.routeDistance, closeTo(2, 0.001));
    });

    test('moves backward through the planning flow', () {
      final controller = PlannerController()
        ..goTo(PlannerStage.configuration)
        ..goBack();

      expect(controller.stage, PlannerStage.interests);
    });
  });
}
