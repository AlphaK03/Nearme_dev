import 'package:flutter/material.dart';
import 'package:nearme/core/theme/app_theme.dart';
import 'package:nearme/features/planner/presentation/nearme_experience.dart';

final class NearMeApp extends StatelessWidget {
  const NearMeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NearMe',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const NearMeExperience(),
    );
  }
}
