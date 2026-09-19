final class AuthSession {
  const AuthSession({required this.userId, this.email});

  final String userId;
  final String? email;
}

final class AuthenticationFailure implements Exception {
  const AuthenticationFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

abstract interface class AuthRepository {
  AuthSession? get currentSession;

  Stream<AuthSession?> observeSession();

  Future<void> signIn({required String email, required String password});

  Future<void> signUp({
    required String displayName,
    required String email,
    required String password,
  });

  Future<void> signOut();
}
