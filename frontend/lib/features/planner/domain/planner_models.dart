import 'package:flutter/material.dart';
import 'package:nearme/core/theme/app_theme.dart';

enum PlannerStage {
  home('Inicio', Icons.home_rounded),
  interests('Intereses', Icons.interests_rounded),
  configuration('Configurar', Icons.tune_rounded),
  places('Lugares', Icons.explore_rounded),
  itinerary('Mi ruta', Icons.route_rounded),
  adjustment('Reajuste', Icons.auto_awesome_rounded);

  const PlannerStage(this.label, this.icon);

  final String label;
  final IconData icon;
}

final class InterestOption {
  const InterestOption({
    required this.id,
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  final String id;
  final String label;
  final String subtitle;
  final IconData icon;
  final Color color;
}

final class PlaceRecommendation {
  const PlaceRecommendation({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.distanceKm,
    required this.durationMinutes,
    required this.rating,
    required this.match,
    required this.price,
    required this.icon,
    required this.color,
  });

  final String id;
  final String name;
  final String category;
  final String description;
  final double distanceKm;
  final int durationMinutes;
  final double rating;
  final int match;
  final String price;
  final IconData icon;
  final Color color;
}

abstract final class PlannerCatalog {
  static const interests = <InterestOption>[
    InterestOption(
      id: 'food',
      label: 'Gastronomía',
      subtitle: 'Cafés y sabores locales',
      icon: Icons.restaurant_rounded,
      color: AppColors.coral,
    ),
    InterestOption(
      id: 'nature',
      label: 'Naturaleza',
      subtitle: 'Parques y aire libre',
      icon: Icons.park_rounded,
      color: Color(0xFF72B77D),
    ),
    InterestOption(
      id: 'culture',
      label: 'Cultura',
      subtitle: 'Museos y patrimonio',
      icon: Icons.account_balance_rounded,
      color: AppColors.gold,
    ),
    InterestOption(
      id: 'entertainment',
      label: 'Entretenimiento',
      subtitle: 'Arte, música y eventos',
      icon: Icons.theater_comedy_rounded,
      color: AppColors.lavender,
    ),
    InterestOption(
      id: 'shopping',
      label: 'Compras',
      subtitle: 'Mercados y diseño local',
      icon: Icons.shopping_bag_rounded,
      color: AppColors.sky,
    ),
    InterestOption(
      id: 'history',
      label: 'Historia',
      subtitle: 'Edificios y memorias',
      icon: Icons.history_edu_rounded,
      color: Color(0xFFBE9878),
    ),
  ];

  static const places = <PlaceRecommendation>[
    PlaceRecommendation(
      id: 'museum',
      name: 'Museo Nacional',
      category: 'Cultura',
      description: 'Historia costarricense en el antiguo Cuartel Bellavista.',
      distanceKm: 0.8,
      durationMinutes: 45,
      rating: 4.8,
      match: 98,
      price: '₡2 500',
      icon: Icons.account_balance_rounded,
      color: Color(0xFFDDBA78),
    ),
    PlaceRecommendation(
      id: 'coffee',
      name: 'Café Otoya',
      category: 'Gastronomía',
      description:
          'Café de especialidad y cocina local en un barrio histórico.',
      distanceKm: 1.2,
      durationMinutes: 40,
      rating: 4.7,
      match: 94,
      price: '₡₡',
      icon: Icons.coffee_rounded,
      color: Color(0xFFB97B61),
    ),
    PlaceRecommendation(
      id: 'park',
      name: 'Parque Nacional',
      category: 'Naturaleza',
      description: 'Un respiro verde rodeado de esculturas y arquitectura.',
      distanceKm: 0.6,
      durationMinutes: 60,
      rating: 4.6,
      match: 91,
      price: 'Gratis',
      icon: Icons.park_rounded,
      color: Color(0xFF72A982),
    ),
    PlaceRecommendation(
      id: 'market',
      name: 'Mercado Central',
      category: 'Gastronomía',
      description: 'Sabores, artesanías y vida cotidiana desde 1880.',
      distanceKm: 1.8,
      durationMinutes: 50,
      rating: 4.5,
      match: 87,
      price: '₡',
      icon: Icons.storefront_rounded,
      color: Color(0xFFE2936D),
    ),
  ];
}
