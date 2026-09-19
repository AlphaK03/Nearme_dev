import 'package:flutter/foundation.dart';
import 'package:nearme/features/interests/domain/interest.dart';
import 'package:nearme/features/interests/domain/interest_repository.dart';

final class InterestSelectionController extends ChangeNotifier {
  InterestSelectionController(this._repository);

  final InterestRepository _repository;

  List<Interest> _interests = const <Interest>[];
  Set<int> _selectedIds = <int>{};
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;

  List<Interest> get interests => _interests;
  Set<int> get selectedIds => Set<int>.unmodifiable(_selectedIds);
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;

  Future<void> load() async {
    if (_isLoading) {
      return;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _interests = await _repository.getAvailableInterests();
      _selectedIds = await _repository.getSelectedInterestIds();
    } on InterestFailure catch (error) {
      _errorMessage = error.message;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void toggle(int interestId) {
    if (_selectedIds.contains(interestId)) {
      _selectedIds.remove(interestId);
    } else {
      _selectedIds.add(interestId);
    }
    notifyListeners();
  }

  Future<bool> save() async {
    if (_isSaving) {
      return false;
    }

    _isSaving = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _repository.replaceSelectedInterests(_selectedIds);
      return true;
    } on InterestFailure catch (error) {
      _errorMessage = error.message;
      return false;
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }
}
