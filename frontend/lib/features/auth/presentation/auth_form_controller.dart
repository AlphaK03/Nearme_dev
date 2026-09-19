import 'package:flutter/foundation.dart';
import 'package:nearme/features/auth/domain/auth_repository.dart';

enum AuthMode { signIn, signUp }

final class AuthFormController extends ChangeNotifier {
  AuthFormController(this._repository);

  final AuthRepository _repository;

  AuthMode _mode = AuthMode.signIn;
  bool _isSubmitting = false;
  String? _errorMessage;
  String? _confirmationMessage;

  AuthMode get mode => _mode;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  String? get confirmationMessage => _confirmationMessage;

  void toggleMode() {
    _mode = _mode == AuthMode.signIn ? AuthMode.signUp : AuthMode.signIn;
    _errorMessage = null;
    _confirmationMessage = null;
    notifyListeners();
  }

  Future<void> submit({
    required String displayName,
    required String email,
    required String password,
  }) async {
    if (_isSubmitting) {
      return;
    }

    _isSubmitting = true;
    _errorMessage = null;
    _confirmationMessage = null;
    notifyListeners();

    try {
      if (_mode == AuthMode.signIn) {
        await _repository.signIn(email: email.trim(), password: password);
      } else {
        await _repository.signUp(
          displayName: displayName.trim(),
          email: email.trim(),
          password: password,
        );
        _confirmationMessage =
            'Account created. Check your email if confirmation is required.';
      }
    } on AuthenticationFailure catch (error) {
      _errorMessage = error.message;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }
}

abstract final class AuthValidators {
  static String? displayName(String? value) {
    final name = value?.trim() ?? '';
    if (name.length < 2) {
      return 'Enter at least 2 characters.';
    }
    return null;
  }

  static String? email(String? value) {
    final email = value?.trim() ?? '';
    final hasValidShape = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
    if (!hasValidShape) {
      return 'Enter a valid email address.';
    }
    return null;
  }

  static String? password(String? value) {
    if ((value ?? '').length < 8) {
      return 'Use at least 8 characters.';
    }
    return null;
  }
}
