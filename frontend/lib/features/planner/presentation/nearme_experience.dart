import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:nearme/core/theme/app_theme.dart';
import 'package:nearme/features/planner/domain/planner_models.dart';
import 'package:nearme/features/planner/presentation/planner_controller.dart';

final class NearMeExperience extends StatefulWidget {
  const NearMeExperience({super.key});

  @override
  State<NearMeExperience> createState() => _NearMeExperienceState();
}

final class _NearMeExperienceState extends State<NearMeExperience> {
  late final PlannerController _controller;

  @override
  void initState() {
    super.initState();
    _controller = PlannerController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return LayoutBuilder(
          builder: (context, constraints) {
            final isDesktop = constraints.maxWidth >= 960;
            return Scaffold(
              body: Row(
                children: <Widget>[
                  if (isDesktop) _DesktopSidebar(controller: _controller),
                  Expanded(
                    child: ColoredBox(
                      color: AppColors.canvas,
                      child: SafeArea(
                        bottom: isDesktop,
                        child: _StageView(
                          controller: _controller,
                          isDesktop: isDesktop,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              bottomNavigationBar: isDesktop
                  ? null
                  : _MobileNavigation(controller: _controller),
            );
          },
        );
      },
    );
  }
}

final class _DesktopSidebar extends StatelessWidget {
  const _DesktopSidebar({required this.controller});

  final PlannerController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 284,
      padding: const EdgeInsets.fromLTRB(28, 32, 28, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(right: BorderSide(color: AppColors.line)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const _Brand(),
          const SizedBox(height: 52),
          const _Eyebrow('TU PRÓXIMO PLAN'),
          const SizedBox(height: 10),
          Text(
            'Descubre San José a tu manera.',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 12),
          const Text(
            'Creamos recorridos que se ajustan a tus gustos, tiempo y ubicación.',
          ),
          const SizedBox(height: 32),
          for (final (index, stage) in PlannerStage.values.indexed)
            Padding(
              padding: const EdgeInsets.only(bottom: 7),
              child: _SidebarDestination(
                index: index,
                stage: stage,
                selected: controller.stage == stage,
                onTap: () => controller.goTo(stage),
              ),
            ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.paleMint,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Row(
              children: <Widget>[
                CircleAvatar(
                  backgroundColor: AppColors.forest,
                  foregroundColor: Colors.white,
                  child: Text('KC'),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'Keylor',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      Text('Explorador local', style: TextStyle(fontSize: 12)),
                    ],
                  ),
                ),
                Icon(Icons.more_horiz_rounded, color: AppColors.muted),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

final class _SidebarDestination extends StatelessWidget {
  const _SidebarDestination({
    required this.index,
    required this.stage,
    required this.selected,
    required this.onTap,
  });

  final int index;
  final PlannerStage stage;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.forest : Colors.transparent,
      borderRadius: BorderRadius.circular(15),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(15),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          child: Row(
            children: <Widget>[
              Text(
                '${index + 1}'.padLeft(2, '0'),
                style: TextStyle(
                  color: selected ? AppColors.lime : AppColors.muted,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(width: 14),
              Icon(
                stage.icon,
                size: 20,
                color: selected ? Colors.white : AppColors.emerald,
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Text(
                  stage.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: selected ? Colors.white : AppColors.ink,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

final class _MobileNavigation extends StatelessWidget {
  const _MobileNavigation({required this.controller});

  final PlannerController controller;

  static const destinations = <PlannerStage>[
    PlannerStage.home,
    PlannerStage.places,
    PlannerStage.itinerary,
    PlannerStage.interests,
  ];

  @override
  Widget build(BuildContext context) {
    final currentIndex = switch (controller.stage) {
      PlannerStage.home => 0,
      PlannerStage.places => 1,
      PlannerStage.itinerary || PlannerStage.adjustment => 2,
      PlannerStage.interests || PlannerStage.configuration => 3,
    };

    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: (index) => controller.goTo(destinations[index]),
      destinations: const <NavigationDestination>[
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded),
          label: 'Inicio',
        ),
        NavigationDestination(
          icon: Icon(Icons.explore_outlined),
          selectedIcon: Icon(Icons.explore_rounded),
          label: 'Explorar',
        ),
        NavigationDestination(
          icon: Icon(Icons.route_outlined),
          selectedIcon: Icon(Icons.route_rounded),
          label: 'Mi ruta',
        ),
        NavigationDestination(
          icon: Icon(Icons.tune_outlined),
          selectedIcon: Icon(Icons.tune_rounded),
          label: 'Preferencias',
        ),
      ],
    );
  }
}

final class _StageView extends StatelessWidget {
  const _StageView({required this.controller, required this.isDesktop});

  final PlannerController controller;
  final bool isDesktop;

  @override
  Widget build(BuildContext context) {
    final page = switch (controller.stage) {
      PlannerStage.home => _HomePage(
        key: const ValueKey<PlannerStage>(PlannerStage.home),
        controller: controller,
        isDesktop: isDesktop,
      ),
      PlannerStage.interests => _InterestsPage(
        key: const ValueKey<PlannerStage>(PlannerStage.interests),
        controller: controller,
        isDesktop: isDesktop,
      ),
      PlannerStage.configuration => _ConfigurationPage(
        key: const ValueKey<PlannerStage>(PlannerStage.configuration),
        controller: controller,
        isDesktop: isDesktop,
      ),
      PlannerStage.places => _PlacesPage(
        key: const ValueKey<PlannerStage>(PlannerStage.places),
        controller: controller,
        isDesktop: isDesktop,
      ),
      PlannerStage.itinerary => _ItineraryPage(
        key: const ValueKey<PlannerStage>(PlannerStage.itinerary),
        controller: controller,
        isDesktop: isDesktop,
      ),
      PlannerStage.adjustment => _AdjustmentPage(
        key: const ValueKey<PlannerStage>(PlannerStage.adjustment),
        controller: controller,
        isDesktop: isDesktop,
      ),
    };

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 280),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.015, 0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        ),
      ),
      child: page,
    );
  }
}

final class _HomePage extends StatelessWidget {
  const _HomePage({
    required this.controller,
    required this.isDesktop,
    super.key,
  });

  final PlannerController controller;
  final bool isDesktop;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: <Widget>[
        SliverPadding(
          padding: EdgeInsets.fromLTRB(
            isDesktop ? 44 : 20,
            isDesktop ? 30 : 16,
            isDesktop ? 44 : 20,
            40,
          ),
          sliver: SliverList.list(
            children: <Widget>[
              _TopBar(isDesktop: isDesktop),
              SizedBox(height: isDesktop ? 28 : 20),
              _HomeHero(controller: controller, isDesktop: isDesktop),
              const SizedBox(height: 30),
              _SectionHeading(
                title: 'Explora según tu ánimo',
                action: 'Ver todo',
                onTap: () => controller.goTo(PlannerStage.interests),
              ),
              const SizedBox(height: 15),
              _CategoryStrip(controller: controller),
              const SizedBox(height: 30),
              _SectionHeading(
                title: 'Muy cerca de ti',
                action: 'Explorar mapa',
                onTap: () => controller.goTo(PlannerStage.places),
              ),
              const SizedBox(height: 15),
              _FeaturedPlaces(
                isDesktop: isDesktop,
                onOpen: () => controller.goTo(PlannerStage.places),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

final class _TopBar extends StatelessWidget {
  const _TopBar({required this.isDesktop});

  final bool isDesktop;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        if (!isDesktop) const _Brand(),
        if (!isDesktop) const Spacer(),
        if (isDesktop)
          Expanded(
            child: Text(
              'Buenos días, Keylor 👋',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
        _LocationPill(compact: !isDesktop),
        const SizedBox(width: 10),
        const _RoundIconButton(
          icon: Icons.notifications_none_rounded,
          tooltip: 'Notificaciones',
        ),
      ],
    );
  }
}

final class _HomeHero extends StatelessWidget {
  const _HomeHero({required this.controller, required this.isDesktop});

  final PlannerController controller;
  final bool isDesktop;

  @override
  Widget build(BuildContext context) {
    final copy = Padding(
      padding: EdgeInsets.all(isDesktop ? 42 : 26),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const _Eyebrow('TU TIEMPO, TU RUTA', light: true),
          const SizedBox(height: 13),
          Text.rich(
            TextSpan(
              children: <InlineSpan>[
                const TextSpan(text: 'Hay un plan perfecto\n'),
                TextSpan(
                  text: 'cerca de ti.',
                  style: TextStyle(color: AppColors.lime),
                ),
              ],
            ),
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
              color: Colors.white,
              fontSize: isDesktop ? 48 : null,
              height: 1.03,
            ),
          ),
          const SizedBox(height: 15),
          Text(
            'Dinos qué te gusta y cuánto tiempo tienes. Nosotros diseñamos el recorrido ideal.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.76),
              fontSize: isDesktop ? 16 : 14,
            ),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 10,
            children: <Widget>[
              FilledButton.icon(
                onPressed: () => controller.goTo(PlannerStage.interests),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.lime,
                  foregroundColor: AppColors.ink,
                  padding: const EdgeInsets.symmetric(horizontal: 22),
                ),
                iconAlignment: IconAlignment.end,
                icon: const Icon(Icons.arrow_forward_rounded),
                label: const Text('Crear mi recorrido'),
              ),
              OutlinedButton.icon(
                onPressed: () => controller.goTo(PlannerStage.places),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  minimumSize: const Size(0, 54),
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.35)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(17),
                  ),
                ),
                icon: const Icon(Icons.explore_outlined),
                label: const Text('Explorar lugares'),
              ),
            ],
          ),
        ],
      ),
    );

    return Container(
      height: isDesktop ? 600 : null,
      constraints: BoxConstraints(minHeight: isDesktop ? 0 : 520),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppColors.forest,
        borderRadius: BorderRadius.circular(isDesktop ? 34 : 28),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x26102D2A),
            blurRadius: 36,
            offset: Offset(0, 18),
          ),
        ],
      ),
      child: isDesktop
          ? Row(
              children: <Widget>[
                Expanded(flex: 5, child: copy),
                const Expanded(flex: 4, child: _DiscoveryMap()),
              ],
            )
          : Column(
              children: <Widget>[
                const SizedBox(height: 260, child: _DiscoveryMap()),
                copy,
              ],
            ),
    );
  }
}

final class _DiscoveryMap extends StatelessWidget {
  const _DiscoveryMap();

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: <Widget>[
        CustomPaint(painter: _MapPainter(showRoute: false)),
        const Positioned(
          top: 46,
          right: 52,
          child: _MapPin(icon: Icons.park_rounded, color: Color(0xFF72A982)),
        ),
        const Positioned(
          left: 48,
          top: 132,
          child: _MapPin(icon: Icons.coffee_rounded, color: AppColors.coral),
        ),
        const Positioned(
          right: 66,
          bottom: 55,
          child: _MapPin(
            icon: Icons.account_balance_rounded,
            color: AppColors.gold,
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          child: Center(
            child: Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: AppColors.lime,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 4),
                boxShadow: const <BoxShadow>[
                  BoxShadow(color: AppColors.lime, blurRadius: 18),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

final class _MapPin extends StatelessWidget {
  const _MapPin({required this.icon, required this.color});

  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 54,
      height: 54,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(27),
          topRight: Radius.circular(27),
          bottomRight: Radius.circular(27),
          bottomLeft: Radius.circular(8),
        ),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x38102D2A),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Icon(icon, color: color),
    );
  }
}

final class _CategoryStrip extends StatelessWidget {
  const _CategoryStrip({required this.controller});

  final PlannerController controller;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 102,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: PlannerCatalog.interests.length,
        separatorBuilder: (context, index) => const SizedBox(width: 11),
        itemBuilder: (context, index) {
          final interest = PlannerCatalog.interests[index];
          return InkWell(
            onTap: () => controller.goTo(PlannerStage.interests),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              width: 164,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppColors.line),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  _ColorIcon(
                    icon: interest.icon,
                    color: interest.color,
                    small: true,
                  ),
                  const SizedBox(height: 7),
                  Text(
                    interest.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

final class _FeaturedPlaces extends StatelessWidget {
  const _FeaturedPlaces({required this.isDesktop, required this.onOpen});

  final bool isDesktop;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final places = PlannerCatalog.places.take(3).toList(growable: false);
    if (isDesktop) {
      return SizedBox(
        height: 236,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            for (final place in places) ...<Widget>[
              Expanded(
                child: _FeaturedPlaceCard(place: place, onTap: onOpen),
              ),
              if (place != places.last) const SizedBox(width: 14),
            ],
          ],
        ),
      );
    }
    return SizedBox(
      height: 236,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: places.length,
        separatorBuilder: (context, index) => const SizedBox(width: 12),
        itemBuilder: (context, index) => SizedBox(
          width: 256,
          child: _FeaturedPlaceCard(place: places[index], onTap: onOpen),
        ),
      ),
    );
  }
}

final class _FeaturedPlaceCard extends StatelessWidget {
  const _FeaturedPlaceCard({required this.place, required this.onTap});

  final PlaceRecommendation place;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Expanded(child: _PlaceArtwork(place: place, compact: false)),
            Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          place.name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.star_rounded,
                        color: AppColors.gold,
                        size: 17,
                      ),
                      Text(
                        '${place.rating}',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  const SizedBox(height: 7),
                  Text('${place.distanceKm} km · ${place.durationMinutes} min'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

final class _InterestsPage extends StatelessWidget {
  const _InterestsPage({
    required this.controller,
    required this.isDesktop,
    super.key,
  });

  final PlannerController controller;
  final bool isDesktop;

  @override
  Widget build(BuildContext context) {
    return _FlowPage(
      isDesktop: isDesktop,
      header: _FlowHeader(
        title: '¿Qué te gustaría descubrir?',
        subtitle:
            'Selecciona al menos dos intereses. Puedes cambiarlos cuando quieras.',
        eyebrow: 'PERSONALIZA TU EXPERIENCIA',
        step: 1,
        onBack: controller.goBack,
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final columns = constraints.maxWidth >= 900
              ? 3
              : constraints.maxWidth >= 560
              ? 2
              : 2;
          return GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: PlannerCatalog.interests.length,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: columns,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: constraints.maxWidth < 390 ? 0.94 : 1.18,
            ),
            itemBuilder: (context, index) {
              final interest = PlannerCatalog.interests[index];
              final selected = controller.selectedInterestIds.contains(
                interest.id,
              );
              return _InterestCard(
                interest: interest,
                selected: selected,
                onTap: () => controller.toggleInterest(interest.id),
              );
            },
          );
        },
      ),
      footer: _FlowFooter(
        leading:
            '${controller.selectedInterestIds.length} intereses seleccionados',
        label: 'Continuar',
        enabled: controller.canContinueFromInterests,
        onPressed: () => controller.goTo(PlannerStage.configuration),
      ),
    );
  }
}

final class _InterestCard extends StatelessWidget {
  const _InterestCard({
    required this.interest,
    required this.selected,
    required this.onTap,
  });

  final InterestOption interest;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.paleMint : Colors.white,
      shape: RoundedRectangleBorder(
        side: BorderSide(
          color: selected ? AppColors.emerald : AppColors.line,
          width: selected ? 1.6 : 1,
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Stack(
            children: <Widget>[
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  _ColorIcon(icon: interest.icon, color: interest.color),
                  const SizedBox(height: 14),
                  Text(
                    interest.label,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    interest.subtitle,
                    maxLines: 2,
                    style: const TextStyle(fontSize: 11),
                  ),
                ],
              ),
              if (selected)
                const Positioned(
                  top: 0,
                  right: 0,
                  child: CircleAvatar(
                    radius: 11,
                    backgroundColor: AppColors.emerald,
                    foregroundColor: Colors.white,
                    child: Icon(Icons.check_rounded, size: 14),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

final class _ConfigurationPage extends StatelessWidget {
  const _ConfigurationPage({
    required this.controller,
    required this.isDesktop,
    super.key,
  });

  final PlannerController controller;
  final bool isDesktop;

  @override
  Widget build(BuildContext context) {
    final settings = <Widget>[
      _SettingCard(
        icon: Icons.schedule_rounded,
        title: 'Tiempo disponible',
        child: Column(
          children: <Widget>[
            const SizedBox(height: 8),
            Text.rich(
              TextSpan(
                children: <InlineSpan>[
                  TextSpan(
                    text: '${controller.availableHours}',
                    style: const TextStyle(
                      color: AppColors.ink,
                      fontSize: 42,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -2,
                    ),
                  ),
                  const TextSpan(text: '  horas'),
                ],
              ),
            ),
            Slider(
              value: controller.availableHours.toDouble(),
              min: 1,
              max: 8,
              divisions: 7,
              activeColor: AppColors.emerald,
              onChanged: (value) => controller.setAvailableHours(value.round()),
            ),
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[Text('1 h'), Text('4 h'), Text('8 h')],
            ),
          ],
        ),
      ),
      _SettingCard(
        icon: Icons.near_me_rounded,
        title: 'Distancia máxima',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            const SizedBox(height: 18),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                for (final distance in <int>[1, 3, 5, 10])
                  ChoiceChip(
                    label: Text('$distance km'),
                    selected: controller.maximumDistanceKm == distance,
                    onSelected: (_) => controller.setMaximumDistance(distance),
                  ),
              ],
            ),
            const SizedBox(height: 15),
            Text(
              'Aproximadamente ${controller.maximumDistanceKm * 5} min entre lugares',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
      _SettingCard(
        icon: Icons.directions_walk_rounded,
        title: 'Cómo prefieres moverte',
        child: Padding(
          padding: const EdgeInsets.only(top: 16),
          child: SegmentedButton<String>(
            showSelectedIcon: false,
            segments: const <ButtonSegment<String>>[
              ButtonSegment<String>(
                value: 'Caminando',
                icon: Icon(Icons.directions_walk_rounded),
                label: Text('A pie'),
              ),
              ButtonSegment<String>(
                value: 'Bicicleta',
                icon: Icon(Icons.pedal_bike_rounded),
                label: Text('Bici'),
              ),
              ButtonSegment<String>(
                value: 'Vehículo',
                icon: Icon(Icons.directions_car_rounded),
                label: Text('Auto'),
              ),
            ],
            selected: <String>{controller.travelMode},
            onSelectionChanged: (value) =>
                controller.setTravelMode(value.first),
          ),
        ),
      ),
      const _LocationCard(),
    ];

    return _FlowPage(
      isDesktop: isDesktop,
      header: _FlowHeader(
        title: '¿Cuánto tiempo tienes?',
        subtitle: 'Ajustaremos el plan para que disfrutes sin prisas.',
        eyebrow: 'ARMA TU RECORRIDO',
        step: 2,
        onBack: controller.goBack,
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth < 760) {
            return Column(
              children: <Widget>[
                for (final setting in settings) ...<Widget>[
                  setting,
                  const SizedBox(height: 12),
                ],
              ],
            );
          }
          return Wrap(
            spacing: 14,
            runSpacing: 14,
            children: <Widget>[
              for (final setting in settings)
                SizedBox(
                  width: (constraints.maxWidth - 14) / 2,
                  child: setting,
                ),
            ],
          );
        },
      ),
      footer: _FlowFooter(
        leading:
            '${controller.availableHours} h · ${controller.maximumDistanceKm} km · ${controller.travelMode}',
        label: 'Buscar lugares',
        enabled: true,
        onPressed: () => controller.goTo(PlannerStage.places),
      ),
    );
  }
}

final class _SettingCard extends StatelessWidget {
  const _SettingCard({
    required this.icon,
    required this.title,
    required this.child,
  });

  final IconData icon;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Row(
              children: <Widget>[
                _ColorIcon(icon: icon, color: AppColors.emerald, small: true),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            child,
          ],
        ),
      ),
    );
  }
}

final class _LocationCard extends StatelessWidget {
  const _LocationCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.paleMint,
        borderRadius: BorderRadius.circular(22),
      ),
      child: const Row(
        children: <Widget>[
          _ColorIcon(icon: Icons.my_location_rounded, color: AppColors.emerald),
          SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Tu ubicación', style: TextStyle(fontSize: 11)),
                SizedBox(height: 2),
                Text(
                  'Centro de San José',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          Text(
            'Editar',
            style: TextStyle(
              color: AppColors.emerald,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

final class _PlacesPage extends StatelessWidget {
  const _PlacesPage({
    required this.controller,
    required this.isDesktop,
    super.key,
  });

  final PlannerController controller;
  final bool isDesktop;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: <Widget>[
        CustomScrollView(
          slivers: <Widget>[
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                isDesktop ? 44 : 20,
                isDesktop ? 30 : 14,
                isDesktop ? 44 : 20,
                130,
              ),
              sliver: SliverList.list(
                children: <Widget>[
                  _PageToolbar(
                    onBack: controller.goBack,
                    title: 'Cerca de ti',
                    eyebrow: 'RECOMENDACIONES',
                    trailing: const _RoundIconButton(
                      icon: Icons.tune_rounded,
                      tooltip: 'Filtros',
                    ),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    readOnly: true,
                    onTap: () {},
                    decoration: const InputDecoration(
                      hintText: 'Buscar lugares o actividades',
                      prefixIcon: Icon(Icons.search_rounded),
                      suffixIcon: Icon(Icons.mic_none_rounded),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: <Widget>[
                        for (final filter in <String>[
                          'Todos',
                          'Gastronomía',
                          'Naturaleza',
                          'Cultura',
                        ]) ...<Widget>[
                          ChoiceChip(
                            label: Text(filter),
                            selected: controller.placeFilter == filter,
                            onSelected: (_) =>
                                controller.setPlaceFilter(filter),
                          ),
                          const SizedBox(width: 8),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(
                          '${controller.filteredPlaces.length} lugares encontrados',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Icon(
                        Icons.auto_awesome,
                        size: 15,
                        color: AppColors.emerald,
                      ),
                      const SizedBox(width: 5),
                      const Flexible(
                        child: Text(
                          'Ordenados para ti',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 13),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final columns = constraints.maxWidth >= 1000
                          ? 3
                          : constraints.maxWidth >= 680
                          ? 2
                          : 1;
                      final width =
                          (constraints.maxWidth - (columns - 1) * 14) / columns;
                      return Wrap(
                        spacing: 14,
                        runSpacing: 14,
                        children: <Widget>[
                          for (final place in controller.filteredPlaces)
                            SizedBox(
                              width: width,
                              child: _PlaceCard(
                                place: place,
                                selected: controller.selectedPlaceIds.contains(
                                  place.id,
                                ),
                                onToggle: () =>
                                    controller.togglePlace(place.id),
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: _FloatingRouteSummary(controller: controller),
        ),
      ],
    );
  }
}

final class _PlaceCard extends StatelessWidget {
  const _PlaceCard({
    required this.place,
    required this.selected,
    required this.onToggle,
  });

  final PlaceRecommendation place;
  final bool selected;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: SizedBox(
        height: 172,
        child: Row(
          children: <Widget>[
            SizedBox(
              width: 126,
              child: _PlaceArtwork(place: place, compact: true),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(15),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            place.category.toUpperCase(),
                            style: const TextStyle(
                              color: AppColors.emerald,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.star_rounded,
                          color: AppColors.gold,
                          size: 15,
                        ),
                        Text(
                          '${place.rating}',
                          style: const TextStyle(fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 7),
                    Text(
                      place.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      place.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11),
                    ),
                    const Spacer(),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            '${place.distanceKm} km · ${place.durationMinutes} min · ${place.price}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 10),
                          ),
                        ),
                        const SizedBox(width: 4),
                        IconButton.filled(
                          onPressed: onToggle,
                          style: IconButton.styleFrom(
                            backgroundColor: selected
                                ? AppColors.emerald
                                : AppColors.paleMint,
                            foregroundColor: selected
                                ? Colors.white
                                : AppColors.emerald,
                          ),
                          icon: Icon(
                            selected ? Icons.check_rounded : Icons.add_rounded,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

final class _PlaceArtwork extends StatelessWidget {
  const _PlaceArtwork({required this.place, required this.compact});

  final PlaceRecommendation place;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: <Widget>[
        ColoredBox(color: place.color),
        Positioned(
          left: -32,
          bottom: -46,
          child: Container(
            width: 130,
            height: 130,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.13),
              shape: BoxShape.circle,
            ),
          ),
        ),
        Center(
          child: Icon(
            place.icon,
            color: Colors.white,
            size: compact ? 45 : 52,
            shadows: const <Shadow>[
              Shadow(
                color: Color(0x44000000),
                blurRadius: 13,
                offset: Offset(0, 7),
              ),
            ],
          ),
        ),
        Positioned(
          top: 10,
          left: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '${place.match}% match',
              style: const TextStyle(
                color: AppColors.forest,
                fontSize: 9,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

final class _FloatingRouteSummary extends StatelessWidget {
  const _FloatingRouteSummary({required this.controller});

  final PlannerController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 18),
      padding: const EdgeInsets.fromLTRB(19, 13, 13, 13),
      constraints: const BoxConstraints(maxWidth: 720),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x45102D2A),
            blurRadius: 25,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  '${controller.selectedPlaceIds.length} lugares',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${_formatMinutes(controller.routeMinutes)} · ${controller.routeDistance.toStringAsFixed(1)} km',
                  style: const TextStyle(
                    color: Color(0xFFACC0BC),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          FilledButton(
            onPressed: controller.canCreateRoute
                ? () => controller.goTo(PlannerStage.itinerary)
                : null,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.lime,
              foregroundColor: AppColors.ink,
              minimumSize: const Size(130, 48),
            ),
            child: const Text('Crear ruta'),
          ),
        ],
      ),
    );
  }
}

final class _ItineraryPage extends StatelessWidget {
  const _ItineraryPage({
    required this.controller,
    required this.isDesktop,
    super.key,
  });

  final PlannerController controller;
  final bool isDesktop;

  @override
  Widget build(BuildContext context) {
    final routeMap = ClipRRect(
      borderRadius: BorderRadius.circular(30),
      child: SizedBox(
        height: isDesktop ? 620 : 285,
        child: Stack(
          fit: StackFit.expand,
          children: <Widget>[
            CustomPaint(painter: _MapPainter(showRoute: true)),
            Positioned(
              top: 20,
              left: 18,
              child: _RoundIconButton(
                icon: Icons.arrow_back_ios_new_rounded,
                tooltip: 'Volver',
                onPressed: controller.goBack,
              ),
            ),
            const Positioned(
              top: 20,
              right: 18,
              child: _RoundIconButton(
                icon: Icons.more_horiz_rounded,
                tooltip: 'Más opciones',
              ),
            ),
            for (final marker in const <(double, double, String)>[
              (0.19, 0.24, '1'),
              (0.52, 0.48, '2'),
              (0.81, 0.72, '3'),
            ])
              Positioned(
                left: marker.$1 * (isDesktop ? 330 : 260),
                top: marker.$2 * (isDesktop ? 460 : 210),
                child: _RouteMarker(label: marker.$3),
              ),
          ],
        ),
      ),
    );

    final details = _RouteDetails(controller: controller);

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        isDesktop ? 44 : 16,
        isDesktop ? 30 : 12,
        isDesktop ? 44 : 16,
        40,
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1180),
          child: isDesktop
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Expanded(flex: 4, child: routeMap),
                    const SizedBox(width: 22),
                    Expanded(flex: 6, child: details),
                  ],
                )
              : Column(
                  children: <Widget>[
                    routeMap,
                    Transform.translate(
                      offset: const Offset(0, -24),
                      child: details,
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

final class _RouteDetails extends StatelessWidget {
  const _RouteDetails({required this.controller});

  final PlannerController controller;

  @override
  Widget build(BuildContext context) {
    final places = controller.routePlaces;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.paper,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(30),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x11102D2A),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Center(
            child: Container(
              width: 42,
              height: 5,
              decoration: BoxDecoration(
                color: AppColors.line,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const _Eyebrow('LISTO PARA EXPLORAR'),
                    const SizedBox(height: 6),
                    Text(
                      'Una tarde en San José',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ],
                ),
              ),
              const _ScoreBadge(),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: <Widget>[
              Expanded(
                child: _Stat(
                  icon: Icons.schedule_rounded,
                  value: _formatMinutes(controller.routeMinutes),
                  label: 'duración',
                ),
              ),
              Expanded(
                child: _Stat(
                  icon: Icons.near_me_rounded,
                  value: '${controller.routeDistance.toStringAsFixed(1)} km',
                  label: 'distancia',
                ),
              ),
              Expanded(
                child: _Stat(
                  icon: Icons.place_rounded,
                  value: '${places.length}',
                  label: 'paradas',
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          for (final (index, place) in places.indexed) ...<Widget>[
            _TimelineStop(index: index, place: place),
            if (index < places.length - 1)
              const _TravelLink(label: '12 min caminando · 0.8 km'),
          ],
          const SizedBox(height: 22),
          FilledButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    '¡Recorrido iniciado! Te guiaremos en cada parada.',
                  ),
                ),
              );
            },
            iconAlignment: IconAlignment.end,
            icon: const Icon(Icons.arrow_forward_rounded),
            label: const Text('Iniciar recorrido'),
          ),
          TextButton(
            onPressed: () => controller.goTo(PlannerStage.adjustment),
            child: const Text('Simular cambio de tiempo'),
          ),
        ],
      ),
    );
  }
}

final class _Stat extends StatelessWidget {
  const _Stat({required this.icon, required this.value, required this.label});

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 13),
      decoration: const BoxDecoration(
        border: Border(right: BorderSide(color: AppColors.line)),
      ),
      child: Column(
        children: <Widget>[
          Icon(icon, size: 18, color: AppColors.emerald),
          const SizedBox(height: 5),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
          ),
          Text(label, style: const TextStyle(fontSize: 10)),
        ],
      ),
    );
  }
}

final class _TimelineStop extends StatelessWidget {
  const _TimelineStop({required this.index, required this.place});

  final int index;
  final PlaceRecommendation place;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        CircleAvatar(
          radius: 14,
          backgroundColor: AppColors.emerald,
          foregroundColor: Colors.white,
          child: Text('${index + 1}', style: const TextStyle(fontSize: 11)),
        ),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                '${2 + index}:${index == 0
                    ? '00'
                    : index == 1
                    ? '57'
                    : '45'} PM · ${place.durationMinutes} MIN',
                style: const TextStyle(
                  color: AppColors.emerald,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                place.name,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              Text(
                '${place.category} · ${place.price}',
                style: const TextStyle(fontSize: 11),
              ),
            ],
          ),
        ),
        _ColorIcon(icon: place.icon, color: place.color),
      ],
    );
  }
}

final class _TravelLink extends StatelessWidget {
  const _TravelLink({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(left: 13),
      padding: const EdgeInsets.fromLTRB(26, 10, 0, 10),
      decoration: const BoxDecoration(
        border: Border(left: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        children: <Widget>[
          const Icon(
            Icons.directions_walk_rounded,
            size: 14,
            color: AppColors.muted,
          ),
          const SizedBox(width: 5),
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 10),
            ),
          ),
        ],
      ),
    );
  }
}

final class _AdjustmentPage extends StatelessWidget {
  const _AdjustmentPage({
    required this.controller,
    required this.isDesktop,
    super.key,
  });

  final PlannerController controller;
  final bool isDesktop;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        isDesktop ? 44 : 20,
        isDesktop ? 30 : 14,
        isDesktop ? 44 : 20,
        42,
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: Column(
            children: <Widget>[
              _PageToolbar(
                onBack: controller.goBack,
                title: 'Recorrido en curso',
                trailing: _RoundIconButton(
                  icon: Icons.close_rounded,
                  tooltip: 'Cerrar',
                  onPressed: () => controller.goTo(PlannerStage.home),
                ),
              ),
              const SizedBox(height: 34),
              const _AdjustmentGraphic(),
              const SizedBox(height: 22),
              const _Eyebrow('RUTA ACTUALIZADA'),
              const SizedBox(height: 8),
              Text(
                controller.adjustedRouteAccepted
                    ? 'Tu nueva ruta está lista.'
                    : 'Nos adaptamos a tu tiempo.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 11),
              Text(
                controller.adjustedRouteAccepted
                    ? 'Guardamos los cambios. Puedes continuar cuando quieras.'
                    : 'Te quedaste 30 minutos más en el museo. Reorganizamos el resto del recorrido.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 25),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.forest,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            'TIEMPO RESTANTE',
                            style: TextStyle(
                              color: Color(0xFFB9CCC8),
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            '1 h 30 min',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Chip(
                      label: Text('−30 min'),
                      backgroundColor: Color(0xFFFFDCD5),
                      side: BorderSide.none,
                      labelStyle: TextStyle(
                        color: Color(0xFFA34A3C),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: <Widget>[
                      const Row(
                        children: <Widget>[
                          Expanded(
                            child: Text(
                              'Tu nuevo recorrido',
                              style: TextStyle(fontWeight: FontWeight.w800),
                            ),
                          ),
                          Text('2 paradas', style: TextStyle(fontSize: 11)),
                        ],
                      ),
                      const Divider(height: 26),
                      _UpdatedStop(
                        number: 1,
                        time: 'AHORA · 40 MIN',
                        name: 'Café Otoya',
                        note: '8 min caminando desde aquí',
                        icon: Icons.coffee_rounded,
                        color: const Color(0xFFB97B61),
                      ),
                      const Divider(height: 22),
                      _UpdatedStop(
                        number: 2,
                        time: '4:15 PM · 35 MIN',
                        name: 'Parque Nacional',
                        note: 'Duración reducida 25 min',
                        icon: Icons.park_rounded,
                        color: const Color(0xFF72A982),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 13),
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3D9),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Icon(Icons.sync_rounded, color: Color(0xFF9A7432)),
                    SizedBox(width: 11),
                    Expanded(
                      child: Text.rich(
                        TextSpan(
                          children: <InlineSpan>[
                            TextSpan(
                              text: '¿Qué cambió?\n',
                              style: TextStyle(fontWeight: FontWeight.w800),
                            ),
                            TextSpan(
                              text:
                                  'Acortamos la visita al parque para terminar a tiempo.',
                            ),
                          ],
                        ),
                        style: TextStyle(color: Color(0xFF745C33)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: controller.adjustedRouteAccepted
                    ? () => controller.goTo(PlannerStage.home)
                    : () {
                        controller.acceptAdjustedRoute();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('¡Nueva ruta guardada!'),
                          ),
                        );
                      },
                iconAlignment: IconAlignment.end,
                icon: Icon(
                  controller.adjustedRouteAccepted
                      ? Icons.home_rounded
                      : Icons.arrow_forward_rounded,
                ),
                label: Text(
                  controller.adjustedRouteAccepted
                      ? 'Volver al inicio'
                      : 'Aceptar nueva ruta',
                ),
              ),
              TextButton(
                onPressed: () => controller.goTo(PlannerStage.itinerary),
                child: const Text('Mantener ruta original'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

final class _UpdatedStop extends StatelessWidget {
  const _UpdatedStop({
    required this.number,
    required this.time,
    required this.name,
    required this.note,
    required this.icon,
    required this.color,
  });

  final int number;
  final String time;
  final String name;
  final String note;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        CircleAvatar(
          radius: 14,
          backgroundColor: AppColors.emerald,
          foregroundColor: Colors.white,
          child: Text('$number', style: const TextStyle(fontSize: 11)),
        ),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                time,
                style: const TextStyle(
                  color: AppColors.emerald,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(name, style: const TextStyle(fontWeight: FontWeight.w800)),
              Text(note, style: const TextStyle(fontSize: 11)),
            ],
          ),
        ),
        _ColorIcon(icon: icon, color: color),
      ],
    );
  }
}

final class _AdjustmentGraphic extends StatelessWidget {
  const _AdjustmentGraphic();

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: <Widget>[
        Container(
          width: 90,
          height: 90,
          decoration: BoxDecoration(
            color: AppColors.mint,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.paleMint, width: 11),
          ),
          child: const Icon(
            Icons.schedule_rounded,
            size: 34,
            color: AppColors.forest,
          ),
        ),
        const Positioned(
          right: -2,
          bottom: 4,
          child: CircleAvatar(
            radius: 13,
            backgroundColor: AppColors.emerald,
            foregroundColor: Colors.white,
            child: Icon(Icons.check_rounded, size: 16),
          ),
        ),
        const Positioned(
          left: -34,
          top: 8,
          child: Icon(
            Icons.auto_awesome_rounded,
            color: AppColors.gold,
            size: 18,
          ),
        ),
        const Positioned(
          right: -30,
          top: -3,
          child: Icon(
            Icons.auto_awesome_rounded,
            color: AppColors.gold,
            size: 13,
          ),
        ),
      ],
    );
  }
}

final class _FlowPage extends StatelessWidget {
  const _FlowPage({
    required this.isDesktop,
    required this.header,
    required this.body,
    required this.footer,
  });

  final bool isDesktop;
  final Widget header;
  final Widget body;
  final Widget footer;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Expanded(
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(
              isDesktop ? 44 : 20,
              isDesktop ? 30 : 14,
              isDesktop ? 44 : 20,
              26,
            ),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1040),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[header, const SizedBox(height: 28), body],
                ),
              ),
            ),
          ),
        ),
        footer,
      ],
    );
  }
}

final class _FlowHeader extends StatelessWidget {
  const _FlowHeader({
    required this.title,
    required this.subtitle,
    required this.eyebrow,
    required this.step,
    required this.onBack,
  });

  final String title;
  final String subtitle;
  final String eyebrow;
  final int step;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
            _RoundIconButton(
              icon: Icons.arrow_back_ios_new_rounded,
              tooltip: 'Volver',
              onPressed: onBack,
            ),
            const Spacer(),
            _StepProgress(step: step),
            const Spacer(),
            Text('$step de 3', style: const TextStyle(fontSize: 11)),
          ],
        ),
        const SizedBox(height: 28),
        _Eyebrow(eyebrow),
        const SizedBox(height: 9),
        Text(title, style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 8),
        Text(subtitle, style: Theme.of(context).textTheme.bodyLarge),
      ],
    );
  }
}

final class _FlowFooter extends StatelessWidget {
  const _FlowFooter({
    required this.leading,
    required this.label,
    required this.enabled,
    required this.onPressed,
  });

  final String leading;
  final String label;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.line)),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Color(0x0A102D2A),
            blurRadius: 18,
            offset: Offset(0, -8),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 13, 20, 13),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1040),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      leading,
                      style: const TextStyle(
                        color: AppColors.emerald,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  FilledButton.icon(
                    onPressed: enabled ? onPressed : null,
                    iconAlignment: IconAlignment.end,
                    icon: const Icon(Icons.arrow_forward_rounded),
                    label: Text(label),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

final class _PageToolbar extends StatelessWidget {
  const _PageToolbar({
    required this.onBack,
    required this.title,
    required this.trailing,
    this.eyebrow,
  });

  final VoidCallback onBack;
  final String title;
  final String? eyebrow;
  final Widget trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        _RoundIconButton(
          icon: Icons.arrow_back_ios_new_rounded,
          tooltip: 'Volver',
          onPressed: onBack,
        ),
        Expanded(
          child: Column(
            children: <Widget>[
              if (eyebrow case final value?)
                Text(
                  value,
                  style: const TextStyle(
                    color: AppColors.emerald,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
              Text(title, style: Theme.of(context).textTheme.titleLarge),
            ],
          ),
        ),
        trailing,
      ],
    );
  }
}

final class _SectionHeading extends StatelessWidget {
  const _SectionHeading({
    required this.title,
    required this.action,
    required this.onTap,
  });

  final String title;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
        TextButton(onPressed: onTap, child: Text(action)),
      ],
    );
  }
}

final class _Brand extends StatelessWidget {
  const _Brand();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Transform.rotate(
          angle: -0.08,
          child: Container(
            width: 38,
            height: 38,
            decoration: const BoxDecoration(
              color: AppColors.forest,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(13),
                topRight: Radius.circular(13),
                bottomRight: Radius.circular(13),
                bottomLeft: Radius.circular(5),
              ),
            ),
            child: const Icon(
              Icons.near_me_rounded,
              color: Colors.white,
              size: 19,
            ),
          ),
        ),
        const SizedBox(width: 10),
        const Text(
          'NearMe',
          style: TextStyle(
            color: AppColors.ink,
            fontSize: 23,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.9,
          ),
        ),
      ],
    );
  }
}

final class _Eyebrow extends StatelessWidget {
  const _Eyebrow(this.text, {this.light = false});

  final String text;
  final bool light;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        color: light ? AppColors.lime : AppColors.emerald,
        fontSize: 10,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.6,
      ),
    );
  }
}

final class _LocationPill extends StatelessWidget {
  const _LocationPill({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(
            Icons.location_on_rounded,
            color: AppColors.emerald,
            size: 17,
          ),
          if (!compact) ...<Widget>[
            const SizedBox(width: 6),
            const Text(
              'San José, CR',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ],
        ],
      ),
    );
  }
}

final class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({
    required this.icon,
    required this.tooltip,
    this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onPressed ?? () {},
      tooltip: tooltip,
      style: IconButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.ink,
        side: const BorderSide(color: AppColors.line),
        minimumSize: const Size.square(43),
      ),
      icon: Icon(icon, size: 20),
    );
  }
}

final class _ColorIcon extends StatelessWidget {
  const _ColorIcon({
    required this.icon,
    required this.color,
    this.small = false,
  });

  final IconData icon;
  final Color color;
  final bool small;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: small ? 34 : 46,
      height: small ? 34 : 46,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(small ? 11 : 14),
      ),
      child: Icon(icon, color: color, size: small ? 18 : 23),
    );
  }
}

final class _StepProgress extends StatelessWidget {
  const _StepProgress({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        for (var index = 1; index <= 3; index++)
          Container(
            width: 30,
            height: 5,
            margin: const EdgeInsets.symmetric(horizontal: 3),
            decoration: BoxDecoration(
              color: index <= step ? AppColors.emerald : AppColors.line,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
      ],
    );
  }
}

final class _ScoreBadge extends StatelessWidget {
  const _ScoreBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.lime, width: 4),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Text(
            '92',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
          ),
          Text('/100', style: TextStyle(fontSize: 7)),
        ],
      ),
    );
  }
}

final class _RouteMarker extends StatelessWidget {
  const _RouteMarker({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: AppColors.forest,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x33102D2A),
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

final class _MapPainter extends CustomPainter {
  const _MapPainter({required this.showRoute});

  final bool showRoute;

  @override
  void paint(Canvas canvas, Size size) {
    final background = Paint()..color = const Color(0xFFDCEAE5);
    canvas.drawRect(Offset.zero & size, background);

    final parkPaint = Paint()..color = const Color(0xFFBFDCCC);
    canvas
      ..drawCircle(
        Offset(size.width * 0.23, size.height * 0.25),
        size.width * 0.1,
        parkPaint,
      )
      ..drawCircle(
        Offset(size.width * 0.82, size.height * 0.42),
        size.width * 0.13,
        parkPaint,
      )
      ..drawCircle(
        Offset(size.width * 0.52, size.height * 0.82),
        size.width * 0.08,
        parkPaint,
      );

    final roadPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.72)
      ..strokeWidth = 8
      ..style = PaintingStyle.stroke;
    final road = Path()
      ..moveTo(-20, size.height * 0.18)
      ..quadraticBezierTo(
        size.width * 0.45,
        size.height * 0.32,
        size.width + 30,
        size.height * 0.72,
      );
    canvas.drawPath(road, roadPaint);

    final smallRoad = Paint()
      ..color = Colors.white.withValues(alpha: 0.48)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    canvas
      ..drawLine(
        Offset(size.width * 0.15, -10),
        Offset(size.width * 0.68, size.height + 10),
        smallRoad,
      )
      ..drawLine(
        Offset(-10, size.height * 0.66),
        Offset(size.width + 10, size.height * 0.38),
        smallRoad,
      );

    if (showRoute) {
      final routePaint = Paint()
        ..color = AppColors.emerald
        ..strokeWidth = 5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;
      final route = Path()
        ..moveTo(size.width * 0.16, size.height * 0.2)
        ..cubicTo(
          size.width * 0.28,
          size.height * 0.24,
          size.width * 0.37,
          size.height * 0.51,
          size.width * 0.53,
          size.height * 0.48,
        )
        ..cubicTo(
          size.width * 0.72,
          size.height * 0.46,
          size.width * 0.68,
          size.height * 0.75,
          size.width * 0.86,
          size.height * 0.75,
        );
      _drawDashedPath(canvas, route, routePaint);
    } else {
      final ringPaint = Paint()
        ..color = Colors.white.withValues(alpha: 0.1)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2;
      canvas
        ..drawCircle(
          Offset(size.width * 0.52, size.height * 0.46),
          size.width * 0.38,
          ringPaint,
        )
        ..drawCircle(
          Offset(size.width * 0.52, size.height * 0.46),
          size.width * 0.27,
          ringPaint,
        );
    }
  }

  @override
  bool shouldRepaint(_MapPainter oldDelegate) =>
      oldDelegate.showRoute != showRoute;

  void _drawDashedPath(Canvas canvas, Path path, Paint paint) {
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = math.min(distance + 10, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance += 17;
      }
    }
  }
}

String _formatMinutes(int minutes) {
  final hours = minutes ~/ 60;
  final remainder = minutes % 60;
  if (hours == 0) {
    return '$remainder min';
  }
  if (remainder == 0) {
    return '$hours h';
  }
  return '$hours h $remainder min';
}
