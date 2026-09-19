import 'dart:async';

import 'package:flutter/material.dart';
import 'package:nearme/features/auth/domain/auth_repository.dart';
import 'package:nearme/features/interests/domain/interest.dart';
import 'package:nearme/features/interests/domain/interest_repository.dart';
import 'package:nearme/features/interests/presentation/interest_selection_controller.dart';

final class InterestSelectionPage extends StatefulWidget {
  const InterestSelectionPage({
    required this.authRepository,
    required this.interestRepository,
    super.key,
  });

  final AuthRepository authRepository;
  final InterestRepository interestRepository;

  @override
  State<InterestSelectionPage> createState() => _InterestSelectionPageState();
}

final class _InterestSelectionPageState extends State<InterestSelectionPage> {
  late final InterestSelectionController _controller;

  @override
  void initState() {
    super.initState();
    _controller = InterestSelectionController(widget.interestRepository);
    unawaited(_controller.load());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Your interests'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Sign out',
            onPressed: () => unawaited(_signOut()),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          if (_controller.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (_controller.errorMessage != null &&
              _controller.interests.isEmpty) {
            return _ErrorView(
              message: _controller.errorMessage!,
              onRetry: _controller.load,
            );
          }

          return _InterestContent(controller: _controller);
        },
      ),
    );
  }

  Future<void> _signOut() async {
    try {
      await widget.authRepository.signOut();
    } on AuthenticationFailure catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }
}

final class _InterestContent extends StatelessWidget {
  const _InterestContent({required this.controller});

  final InterestSelectionController controller;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      children: <Widget>[
        Text(
          'What would you like to discover?',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(
          'Choose one or more topics to personalize nearby recommendations.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: controller.interests
              .map(
                (interest) => FilterChip(
                  avatar: Icon(_iconFor(interest), size: 18),
                  label: Text(interest.name),
                  selected: controller.selectedIds.contains(interest.id),
                  onSelected: (_) => controller.toggle(interest.id),
                ),
              )
              .toList(growable: false),
        ),
        if (controller.errorMessage case final message?) ...<Widget>[
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ],
        const SizedBox(height: 32),
        FilledButton.icon(
          onPressed: controller.isSaving ? null : () => _save(context),
          icon: controller.isSaving
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.save_outlined),
          label: const Text('Save interests'),
        ),
      ],
    );
  }

  Future<void> _save(BuildContext context) async {
    final saved = await controller.save();
    if (saved && context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Interests saved.')));
    }
  }

  IconData _iconFor(Interest interest) {
    return switch (interest.iconName) {
      'account_balance' => Icons.account_balance_outlined,
      'attractions' => Icons.attractions_outlined,
      'forest' => Icons.forest_outlined,
      'local_dining' => Icons.local_dining_outlined,
      'museum' => Icons.museum_outlined,
      'nightlife' => Icons.nightlife_outlined,
      'park' => Icons.park_outlined,
      'shopping_bag' => Icons.shopping_bag_outlined,
      'sports' => Icons.sports_outlined,
      _ => Icons.place_outlined,
    };
  }
}

final class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(Icons.cloud_off_outlined, size: 40),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}
