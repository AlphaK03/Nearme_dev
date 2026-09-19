import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nearme/app/nearme_app.dart';

void main() {
  testWidgets('renders the complete desktop home experience', (tester) async {
    tester.view
      ..physicalSize = const Size(1440, 1000)
      ..devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const NearMeApp());
    await tester.pumpAndSettle();

    expect(find.text('Hay un plan perfecto\ncerca de ti.'), findsOneWidget);
    expect(find.text('Explora según tu ánimo'), findsOneWidget);
    expect(find.text('Muy cerca de ti'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('runs the planning flow on a phone viewport', (tester) async {
    tester.view
      ..physicalSize = const Size(390, 844)
      ..devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const NearMeApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Crear mi recorrido'));
    await tester.pumpAndSettle();

    expect(find.text('¿Qué te gustaría descubrir?'), findsOneWidget);
    expect(find.text('3 intereses seleccionados'), findsOneWidget);

    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.text('¿Cuánto tiempo tienes?'), findsOneWidget);

    await tester.tap(find.text('Buscar lugares'));
    await tester.pumpAndSettle();
    expect(find.text('Cerca de ti'), findsOneWidget);

    await tester.ensureVisible(find.text('Crear ruta'));
    await tester.tap(find.text('Crear ruta'));
    await tester.pumpAndSettle();
    expect(find.text('Una tarde en San José'), findsOneWidget);

    await tester.ensureVisible(find.text('Simular cambio de tiempo'));
    await tester.tap(find.text('Simular cambio de tiempo'));
    await tester.pumpAndSettle();
    expect(find.text('Nos adaptamos a tu tiempo.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
