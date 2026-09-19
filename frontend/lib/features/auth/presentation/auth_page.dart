import 'dart:async';

import 'package:flutter/material.dart';
import 'package:nearme/features/auth/domain/auth_repository.dart';
import 'package:nearme/features/auth/presentation/auth_form_controller.dart';

final class AuthPage extends StatefulWidget {
  const AuthPage({required this.repository, super.key});

  final AuthRepository repository;

  @override
  State<AuthPage> createState() => _AuthPageState();
}

final class _AuthPageState extends State<AuthPage> {
  final _formKey = GlobalKey<FormState>();
  final _displayNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  late final AuthFormController _controller;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _controller = AuthFormController(widget.repository);
  }

  @override
  void dispose() {
    _controller.dispose();
    _displayNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, child) => _buildForm(context),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm(BuildContext context) {
    final isSignUp = _controller.mode == AuthMode.signUp;
    final colorScheme = Theme.of(context).colorScheme;

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Icon(Icons.near_me, size: 48, color: colorScheme.primary),
          const SizedBox(height: 16),
          Text(
            'NearMe',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            isSignUp ? 'Create your account' : 'Welcome back',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 32),
          if (isSignUp) ...<Widget>[
            TextFormField(
              controller: _displayNameController,
              autofillHints: const <String>[AutofillHints.name],
              decoration: const InputDecoration(
                labelText: 'Display name',
                prefixIcon: Icon(Icons.person_outline),
              ),
              textInputAction: TextInputAction.next,
              validator: AuthValidators.displayName,
            ),
            const SizedBox(height: 16),
          ],
          TextFormField(
            controller: _emailController,
            autofillHints: const <String>[AutofillHints.email],
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email_outlined),
            ),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            validator: AuthValidators.email,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _passwordController,
            autofillHints: <String>[
              isSignUp ? AutofillHints.newPassword : AutofillHints.password,
            ],
            decoration: InputDecoration(
              labelText: 'Password',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                tooltip: _obscurePassword ? 'Show password' : 'Hide password',
                onPressed: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
                icon: Icon(
                  _obscurePassword ? Icons.visibility : Icons.visibility_off,
                ),
              ),
            ),
            obscureText: _obscurePassword,
            onFieldSubmitted: (_) => _submit(),
            textInputAction: TextInputAction.done,
            validator: AuthValidators.password,
          ),
          if (_controller.errorMessage case final message?) ...<Widget>[
            const SizedBox(height: 16),
            Text(message, style: TextStyle(color: colorScheme.error)),
          ],
          if (_controller.confirmationMessage case final message?) ...<Widget>[
            const SizedBox(height: 16),
            Text(message, style: TextStyle(color: colorScheme.primary)),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _controller.isSubmitting ? null : _submit,
            child: _controller.isSubmitting
                ? const SizedBox.square(
                    dimension: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(isSignUp ? 'Create account' : 'Sign in'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _controller.isSubmitting ? null : _controller.toggleMode,
            child: Text(
              isSignUp
                  ? 'Already have an account? Sign in'
                  : 'New to NearMe? Create an account',
            ),
          ),
        ],
      ),
    );
  }

  void _submit() {
    if (_formKey.currentState?.validate() != true) {
      return;
    }

    unawaited(
      _controller.submit(
        displayName: _displayNameController.text,
        email: _emailController.text,
        password: _passwordController.text,
      ),
    );
  }
}
