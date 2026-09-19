import 'package:nearme/features/auth/domain/auth_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final class SupabaseAuthRepository implements AuthRepository {
  const SupabaseAuthRepository(this._client);

  final SupabaseClient _client;

  @override
  AuthSession? get currentSession => _mapSession(_client.auth.currentSession);

  @override
  Stream<AuthSession?> observeSession() {
    return _client.auth.onAuthStateChange.map(
      (event) => _mapSession(event.session),
    );
  }

  @override
  Future<void> signIn({required String email, required String password}) async {
    try {
      await _client.auth.signInWithPassword(email: email, password: password);
    } on AuthException catch (error) {
      throw AuthenticationFailure(error.message);
    }
  }

  @override
  Future<void> signUp({
    required String displayName,
    required String email,
    required String password,
  }) async {
    try {
      await _client.auth.signUp(
        email: email,
        password: password,
        data: <String, Object>{'display_name': displayName},
      );
    } on AuthException catch (error) {
      throw AuthenticationFailure(error.message);
    }
  }

  @override
  Future<void> signOut() async {
    try {
      await _client.auth.signOut();
    } on AuthException catch (error) {
      throw AuthenticationFailure(error.message);
    }
  }

  AuthSession? _mapSession(Session? session) {
    if (session == null) {
      return null;
    }

    return AuthSession(userId: session.user.id, email: session.user.email);
  }
}
