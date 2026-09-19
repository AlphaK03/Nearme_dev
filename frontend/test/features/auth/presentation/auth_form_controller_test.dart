import 'package:flutter_test/flutter_test.dart';
import 'package:nearme/features/auth/domain/auth_repository.dart';
import 'package:nearme/features/auth/presentation/auth_form_controller.dart';

void main() {
  group('AuthFormController', () {
    test('signs in with normalized email', () async {
      final repository = _FakeAuthRepository();
      final controller = AuthFormController(repository);

      await controller.submit(
        displayName: '',
        email: '  person@example.com  ',
        password: 'password123',
      );

      expect(repository.lastEmail, 'person@example.com');
      expect(repository.signInCalls, 1);
      expect(controller.errorMessage, isNull);
      expect(controller.isSubmitting, isFalse);
    });

    test('signs up after changing mode', () async {
      final repository = _FakeAuthRepository();
      final controller = AuthFormController(repository)..toggleMode();

      await controller.submit(
        displayName: '  Alex  ',
        email: 'alex@example.com',
        password: 'password123',
      );

      expect(repository.lastDisplayName, 'Alex');
      expect(repository.signUpCalls, 1);
      expect(controller.confirmationMessage, isNotNull);
    });

    test('exposes authentication failures', () async {
      final repository = _FakeAuthRepository(
        failure: const AuthenticationFailure('Invalid credentials.'),
      );
      final controller = AuthFormController(repository);

      await controller.submit(
        displayName: '',
        email: 'person@example.com',
        password: 'password123',
      );

      expect(controller.errorMessage, 'Invalid credentials.');
      expect(controller.isSubmitting, isFalse);
    });
  });

  group('AuthValidators', () {
    test('rejects malformed input', () {
      expect(AuthValidators.displayName('A'), isNotNull);
      expect(AuthValidators.email('invalid'), isNotNull);
      expect(AuthValidators.password('short'), isNotNull);
    });

    test('accepts valid input', () {
      expect(AuthValidators.displayName('Alex'), isNull);
      expect(AuthValidators.email('alex@example.com'), isNull);
      expect(AuthValidators.password('password123'), isNull);
    });
  });
}

final class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({this.failure});

  final AuthenticationFailure? failure;
  int signInCalls = 0;
  int signUpCalls = 0;
  String? lastDisplayName;
  String? lastEmail;

  @override
  AuthSession? get currentSession => null;

  @override
  Stream<AuthSession?> observeSession() => const Stream<AuthSession?>.empty();

  @override
  Future<void> signIn({required String email, required String password}) async {
    signInCalls += 1;
    lastEmail = email;
    if (failure case final error?) {
      throw error;
    }
  }

  @override
  Future<void> signOut() async {}

  @override
  Future<void> signUp({
    required String displayName,
    required String email,
    required String password,
  }) async {
    signUpCalls += 1;
    lastDisplayName = displayName;
    lastEmail = email;
    if (failure case final error?) {
      throw error;
    }
  }
}
