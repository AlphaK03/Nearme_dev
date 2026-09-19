import 'package:flutter/material.dart';
import 'package:nearme/features/auth/domain/auth_repository.dart';
import 'package:nearme/features/auth/presentation/auth_page.dart';
import 'package:nearme/features/interests/domain/interest_repository.dart';
import 'package:nearme/features/interests/presentation/interest_selection_page.dart';

final class AuthGate extends StatelessWidget {
  const AuthGate({
    required this.authRepository,
    required this.interestRepository,
    super.key,
  });

  final AuthRepository authRepository;
  final InterestRepository interestRepository;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthSession?>(
      initialData: authRepository.currentSession,
      stream: authRepository.observeSession(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return const Scaffold(
            body: Center(child: Text('Unable to read the current session.')),
          );
        }

        final session = snapshot.data;
        if (session == null) {
          return AuthPage(repository: authRepository);
        }

        return InterestSelectionPage(
          key: ValueKey<String>(session.userId),
          authRepository: authRepository,
          interestRepository: interestRepository,
        );
      },
    );
  }
}
