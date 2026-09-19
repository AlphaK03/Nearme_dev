import 'package:flutter/foundation.dart';
import 'package:nearme/features/planner/domain/planner_models.dart';

final class PlannerController extends ChangeNotifier {
  PlannerStage _stage = PlannerStage.home;
  final Set<String> _selectedInterestIds = <String>{
    'food',
    'nature',
    'culture',
  };
  final Set<String> _selectedPlaceIds = <String>{'museum', 'coffee', 'park'};
  int _availableHours = 3;
  int _maximumDistanceKm = 3;
  String _travelMode = 'Caminando';
  String _placeFilter = 'Todos';
  bool _adjustedRouteAccepted = false;

  PlannerStage get stage => _stage;
  Set<String> get selectedInterestIds =>
      Set<String>.unmodifiable(_selectedInterestIds);
  Set<String> get selectedPlaceIds =>
      Set<String>.unmodifiable(_selectedPlaceIds);
  int get availableHours => _availableHours;
  int get maximumDistanceKm => _maximumDistanceKm;
  String get travelMode => _travelMode;
  String get placeFilter => _placeFilter;
  bool get adjustedRouteAccepted => _adjustedRouteAccepted;
  bool get canContinueFromInterests => _selectedInterestIds.length >= 2;
  bool get canCreateRoute => _selectedPlaceIds.length >= 2;

  List<PlaceRecommendation> get filteredPlaces {
    if (_placeFilter == 'Todos') {
      return PlannerCatalog.places;
    }
    return PlannerCatalog.places
        .where((place) => place.category == _placeFilter)
        .toList(growable: false);
  }

  List<PlaceRecommendation> get routePlaces => PlannerCatalog.places
      .where((place) => _selectedPlaceIds.contains(place.id))
      .toList(growable: false);

  int get routeMinutes =>
      routePlaces.fold<int>(0, (total, place) => total + place.durationMinutes);

  double get routeDistance =>
      routePlaces.fold<double>(0, (total, place) => total + place.distanceKm);

  void goTo(PlannerStage value) {
    if (_stage == value) {
      return;
    }
    _stage = value;
    notifyListeners();
  }

  void goBack() {
    final index = PlannerStage.values.indexOf(_stage);
    if (index <= 0) {
      return;
    }
    goTo(PlannerStage.values[index - 1]);
  }

  void toggleInterest(String id) {
    if (_selectedInterestIds.contains(id)) {
      _selectedInterestIds.remove(id);
    } else {
      _selectedInterestIds.add(id);
    }
    notifyListeners();
  }

  void setAvailableHours(int value) {
    if (_availableHours == value) {
      return;
    }
    _availableHours = value;
    notifyListeners();
  }

  void setMaximumDistance(int value) {
    if (_maximumDistanceKm == value) {
      return;
    }
    _maximumDistanceKm = value;
    notifyListeners();
  }

  void setTravelMode(String value) {
    if (_travelMode == value) {
      return;
    }
    _travelMode = value;
    notifyListeners();
  }

  void setPlaceFilter(String value) {
    if (_placeFilter == value) {
      return;
    }
    _placeFilter = value;
    notifyListeners();
  }

  void togglePlace(String id) {
    if (_selectedPlaceIds.contains(id)) {
      _selectedPlaceIds.remove(id);
    } else {
      _selectedPlaceIds.add(id);
    }
    notifyListeners();
  }

  void acceptAdjustedRoute() {
    _adjustedRouteAccepted = true;
    notifyListeners();
  }

  void reset() {
    _stage = PlannerStage.home;
    _availableHours = 3;
    _maximumDistanceKm = 3;
    _travelMode = 'Caminando';
    _placeFilter = 'Todos';
    _adjustedRouteAccepted = false;
    _selectedInterestIds
      ..clear()
      ..addAll(<String>{'food', 'nature', 'culture'});
    _selectedPlaceIds
      ..clear()
      ..addAll(<String>{'museum', 'coffee', 'park'});
    notifyListeners();
  }
}
